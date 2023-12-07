import {
  EventType,
  IContent,
  MatrixClient,
  MatrixEvent,
  RelationType,
} from "matrix-js-sdk";
import { AvatarType } from "../components/Avatar";

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
  const sender = e.getSender();
  const inReplyTo = relation?.event_id;
  const key = relation?.key;

  return relation && sender && inReplyTo && key
    ? { inReplyTo, key, sender }
    : null;
};

const toReplacement = (e: MatrixEvent) => {
  const relation = e.getRelation();
  const toReplace = relation?.event_id;
  const newContent = e.getContent()["m.new_content"] as IContent;

  return relation && toReplace && newContent ? { toReplace, newContent } : null;
};

export const getAnnotations = (events: MatrixEvent[]) => {
  const reactions = events.filter((e) => e.getType() === EventType.Reaction);

  return reactions.reduce(
    (init, e) => {
      const annotation = toAnnotation(e);

      if (!annotation) {
        return init;
      }

      const { inReplyTo, key, sender } = annotation;

      return {
        ...init,
        [inReplyTo]: {
          ...init[inReplyTo],
          [key]: {
            ...(init[inReplyTo]?.[key] ?? []),
            sender,
          },
        },
      };
    },
    {} as Record<string, Record<string, string[]>>,
  );
};

export const getReplacements = (events: MatrixEvent[]) => {
  const replacements = events.filter(
    (e) => e.getRelation()?.rel_type === RelationType.Replace ?? false,
  );

  return replacements.reduce(
    (init, e) => {
      const replacement = toReplacement(e);

      if (!replacement) {
        return init;
      }

      const { toReplace, newContent } = replacement;

      return {
        ...init,
        [toReplace]: [...(init[toReplace] ?? []), newContent],
      };
    },
    {} as Record<string, IContent[]>,
  );
};

export const getRedactions = (events: MatrixEvent[]) =>
  events
    .filter((e) => e.getType() === EventType.RoomRedaction)
    .map((e) => e.getContent())
    .reduce(
      (init, content) => ({
        ...init,
        [content.redacts as string]: `(reason: ${content.reason as string})`,
      }),
      {} as Record<string, string>,
    );

export const filterRecord = <T>(ids: string[], record: Record<string, T>) =>
  ids.reduce(
    (init, id) => (record[id] ? { ...init, [id]: record[id]! } : init),
    {} as Record<string, T>,
  );
