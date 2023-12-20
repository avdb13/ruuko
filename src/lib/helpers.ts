import {
  IContent,
  MatrixClient,
  MatrixEvent,
  RelationType,
} from "matrix-js-sdk";

import {AvatarType} from "../components/Avatar";
import {Annotator} from "../components/chips/Annotation";

// export const onImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>,
// blob: Blob) => {
//   e.currentTarget.onerror = null; // prevents looping
//   e.currentTarget.src = URL.createObjectURL(blob);
// }

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

const toAnnotation = (e: MatrixEvent) => {
  const relation = e.getContent()["m.relates_to"];
  const reply_id = relation?.event_id;
  const key = relation?.key;
  const annotator: Annotator = {
    user_id : e.getSender()!,
    event_id : e.getId()!,
  };

  return relation && relation.rel_type === RelationType.Annotation &&
                 annotator && reply_id && key
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

// export const getReceipts = (events: MatrixEvent[]) =>
//   events.reduce(
//     (init, e) => {
//       const annotation = toAnnotation(e);

//       if (!annotation) {
//         return init;
//       }

//       const { reply_id, key, annotator } = annotation;

//       return {
//         ...init,
//         [reply_id]: {
//           ...init[reply_id],
//           [key]: [...(init[reply_id]?.[key] ?? []), annotator],
//         },
//       };
//     },
//     {} as Record<string, Record<string, Annotator[]>>,
//   );

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
