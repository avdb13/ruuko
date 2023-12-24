import {
  IContent,
  MatrixClient,
  MatrixEvent,
  RelationType,
} from "matrix-js-sdk";

import {AvatarType} from "../components/Avatar";
import {Annotator} from "../components/chips/Annotation";
import { Message, isRoomMessage } from "../providers/room";

export const extractAttributes = (s: string, attributes: Array<string>) =>
    attributes.reduce(
        (init, attr) => {
          const match = s.match(new RegExp(`${attr}s*=s*"(.+?)"`));

          if (!match) {
            return init;
          }

          // attr.length + 2 .. match[0].length - 1 =>
          //     _____
          //     '   '
          // src="abc"

          return {
            ...init,
            [attr] : match[0].substring(attr.length + 2, match[0].length - 1),
          };
        },
        {} as Record<string, string>,
    );

export const getAvatarUrl = (
    client: MatrixClient,
    id: string,
    type: AvatarType,
    ) => {
  switch (type) {
  case "room": {
    const room = client.getRoom(id)!;

    return room.getMembers().length <= 2
               ? room.getMembers()
                     .find((member) => member.userId !== client.getUserId())
                     ?.getAvatarUrl(
                         "https://matrix.org",
                         1200,
                         1200,
                         "scale",
                         false,
                         true,
                         )
               : room.getAvatarUrl("https://matrix.org", 1200, 1200, "scale",
                                   true);
  }
  case "user": {
    const user = client.getUser(id);

    if (!user || !user.avatarUrl) {
      return null;
    }

    // bug: avatar doesn't load sometimes since this method returns null for
    // some reason.
    const httpUrl = client.mxcUrlToHttp(
        user.avatarUrl,
        1200,
        1200,
        "scale",
        true,
    );

    return httpUrl;
  }
  }
};

export const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode.toUpperCase().split("").map(
      (char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const toAnnotation = (e: MatrixEvent) => {
  const relation = e.getContent()["m.relates_to"];
  if (relation?.rel_type !== RelationType.Annotation) {
    return null;
  }

  const reply_id = relation?.event_id;
  const key = relation?.key;

  const annotator: Annotator = {
    user_id : e.getSender()!,
    event_id : e.getId()!,
  };

  return annotator && reply_id && key
     ? {reply_id, key, annotator}
     : null;
};

export const getAnnotations = (events: MatrixEvent[]) => events.reduce(
    (init, e) => {
      const annotation = toAnnotation(e);

      if (!annotation) {
        return init;
      }

      const {reply_id, key, annotator} = annotation;

      return {
        ...init,
        [reply_id] : {
          ...init[reply_id],
          [key] : [...(init[reply_id]?.[key] ?? []), annotator ],
        },
      };
    },
    {} as Record<string, Record<string, Annotator[]>>,
);

export const getReplacements = (events: MatrixEvent[]) => events.reduce(
    (init, e) => {
      const target_id = e.getRelation()?.event_id;
      if (!target_id) {
        return init;
      }

      return {
        ...init,
        [target_id] : [...(init[target_id] ?? []), e ],
      };
    },
    {} as Record<string, MatrixEvent[]>,
);

export const getRedactions = (events: MatrixEvent[]) => events.reduce(
    (init, e) => ({
      ...init,
      [e.getContent().redacts as string] : e,
    }),
    {} as Record<string, MatrixEvent>,
);


export const addReplacement = (m: Message, e: MatrixEvent): Message => ({...m, replacements: m.replacements?.concat(e) ?? [e] });
export const addAnnotation = (m: Message, e: MatrixEvent): Message => {
  const key = e.getRelation()!.key;
  const annotation = toAnnotation(e);

  if (!key || !annotation) {
    throw new Error();
  }

  return ({...m, annotations: ({...m.annotations, [key]: [...m.annotations?.[key] ?? [], annotation.annotator] })  })
}
;
export const addRedaction = (m: Message, e: MatrixEvent): Message => ({...m, redaction: e });

export const filterRecord = <T>(ids: string[], record: Record<string, T>) =>
    ids.reduce(
        (init, id) => (record[id] ? {...init, [id] : record[id]!} : init),
        {} as Record<string, T>,
    );


export const formatText = (content: IContent): string => {
  const body = content.body as string;

  const inReplyTo = !!content["m.relates_to"]?.["m.in_reply_to"];
  const replacement =
    content["m.relates_to"]?.rel_type === RelationType.Replace;

      // support inline images
      // if (content.formatted_body) {
      //   const start = (content.formatted_body as string).indexOf("<img");

      //   (content.formatted_body as string).slice(0, start);
      // }

      if (inReplyTo && replacement) {
        return content["m.new_content"].body?.split("\n\n")[1];
      }

      if (inReplyTo) { return content.body?.split("\n\n")[1]; }

      if (replacement) { return content["m.new_content"].body }

      return content.body;
};

export const addNewEvent = (e: MatrixEvent, roomEvents?: Message[]) => {
      const relation = e.getRelation();
      const replacement = relation?.rel_type === RelationType.Replace;
      const annotation = relation?.rel_type === RelationType.Annotation;
      const redaction = e.getContent().redacts as string;

      if (replacement) {
        // if we receive a non-message event roomEvents for this room must be initialized
        return roomEvents!.map((m) =>
          m.event.getId() === relation.event_id ? addReplacement(m, e) : m,
        );
      } else if (annotation) {
        return roomEvents!.map((m) =>
          m.event.getId() === relation.event_id ? addAnnotation(m, e) : m,
        );
      } else if (redaction) {
        return roomEvents!.map((m) =>
          m.event.getId() === redaction ? addRedaction(m, e) : m,
        );
      } else {
        return [...roomEvents ?? [], { event: e }];
      }
}
export const findLastTextEvent = (events: MatrixEvent[], myUserId: string) => {
  for (let i = events.length; i > 0; i -= 1) {
    const currentEvent = events[i];
    const currentRelation = currentEvent?.getRelation();

    const sentByUser = currentEvent?.getSender() === myUserId;
    const isTextMessage =
        currentEvent ? formatText(currentEvent.getContent()) : false;

    if (isTextMessage && sentByUser) {
      const replaceId = currentRelation?.rel_type === RelationType.Replace
                            ? currentRelation?.event_id
                            : currentEvent.getId();

      return replaceId;
    }
  }
};
