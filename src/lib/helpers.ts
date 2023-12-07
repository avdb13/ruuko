import {
  EventType,
  IContent,
  MatrixClient,
  MatrixEvent,
  RelationType,
} from "matrix-js-sdk";
import { AvatarType } from "../components/Avatar";
import { Annotator } from "../components/chips/Annotation";

export const extractAttributes = (
  s: string,
  attributes: Array<string>,
): Map<string, string> => {
  const matches = attributes.map((a) => {
    const match = s.match(new RegExp(`${a}s*=s*"(.+?)"`));

    return match ? (match.every((m) => !!m) ? [a, match[1]!] : null) : null;
  });

  return matches.every((m) => !!m) ? new Map(matches) : null;
};

export const getAvatarUrl = (
  client: MatrixClient,
  id: string,
  type: AvatarType,
) => {
  switch (type) {
    case "room": {
      const room = client.getRoom(id)!;

      return room.getMembers().length <= 2
        ? room
            .getMembers()
            .find((member) => member.userId !== client.getUserId())
            ?.getAvatarUrl("https://matrix.org", 120, 120, "scale", true, true)
        : room.getAvatarUrl("https://matrix.org", 120, 120, "scale", true);
    }
    case "user": {
      const user = client.getUser(id)!;

      // bug: avatar doesn't load sometimes since this method returns null for some reason.
      const httpUrl = client.mxcUrlToHttp(
        user.avatarUrl!,
        120,
        120,
        "scale",
        true,
      );

      // console.log("fetching avatar: ", httpUrl);
      // return !httpUrl || httpUrl.length === 0 ? getAvatarUrl(client, id, type) : httpUrl;
      return httpUrl;
    }
  }
};

export const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};



const toAnnotation = (e: MatrixEvent) => {
  const relation = e.getContent()["m.relates_to"];
  const reply_id = relation?.event_id;
  const key = relation?.key;
  const annotator: Annotator = { user_id: e.getSender()!, event_id: e.getId()! };

  return relation && relation.rel_type === RelationType.Annotation && annotator && reply_id && key
    ? { reply_id, key, annotator }
    : null;
};

export const getAnnotations = (events: MatrixEvent[]) => {
  const reactions = events.filter((e) => e.getType() === EventType.Reaction);

  return reactions.reduce(
    (init, e) => {
      const annotation = toAnnotation(e);

      if (!annotation) {
        return init;
      }

      const { reply_id, key, annotator } = annotation;

      return {
        ...init,
        [reply_id]: {
          ...init[reply_id],
          [key]: {
            ...init[reply_id]?.[key] ?? [],
            annotator,
          },
        },
      };
    },
    {} as Record<string, Record<string, Annotator[]>>,
  );
};

export const getReplacements = (events: MatrixEvent[]) => {
  const replacements = events.filter(
    (e) => e.getRelation()?.rel_type === RelationType.Replace ?? false,
  );

  return replacements.reduce(
    (init, e) => {
      const replacement = e.getRelation()?.rel_type === RelationType.Replace;
      const target_id = e.getRelation()?.event_id;

      if (!(replacement && target_id)) {
        return init;
      }

      return {
        ...init,
        [target_id]: [...init[target_id] ?? [], e],
      };
    },
    {} as Record<string, MatrixEvent[]>,
  );
};

export const getRedactions = (events: MatrixEvent[]) =>
  events
    .filter((e) => e.getType() === EventType.RoomRedaction)
    .reduce(
      (init, e) => ({
        ...init,
        [e.getContent().redacts as string]: e,
      }),
      {} as Record<string, MatrixEvent>,
    );

export const filterRecord = <T>(ids: string[], record: Record<string, T>) =>
  ids.reduce(
    (init, id) => (record[id] ? { ...init, [id]: record[id]! } : init),
    {} as Record<string, T>,
  );
