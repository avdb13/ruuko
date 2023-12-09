import {
  EventType,
  IContent,
  MatrixClient,
  MatrixEvent,
  RelationType,
} from "matrix-js-sdk";
import { AvatarType } from "../components/Avatar";
import { Annotator } from "../components/chips/Annotation";

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
        [attr]: match[0].substring(attr.length + 2, match[0].length - 1),
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
        ? room
            .getMembers()
            .find((member) => member.userId !== client.getUserId())
            ?.getAvatarUrl(
              "https://matrix.org",
              1200,
              1200,
              "scale",
              true,
              true,
            )
        : room.getAvatarUrl("https://matrix.org", 1200, 1200, "scale", true);
    }
    case "user": {
      const user = client.getUser(id)!;

      // bug: avatar doesn't load sometimes since this method returns null for some reason.
      const httpUrl = client.mxcUrlToHttp(
        user.avatarUrl!,
        1200,
        1200,
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
  const annotator: Annotator = {
    user_id: e.getSender()!,
    event_id: e.getId()!,
  };

  return relation &&
    relation.rel_type === RelationType.Annotation &&
    annotator &&
    reply_id &&
    key
    ? { reply_id, key, annotator }
    : null;
};

export const getAnnotations = (events: MatrixEvent[]) =>
  events.reduce(
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
          [key]: [...(init[reply_id]?.[key] ?? []), annotator],
        },
      };
    },
    {} as Record<string, Record<string, Annotator[]>>,
  );

export const getReplacements = (events: MatrixEvent[]) =>
  events.reduce(
    (init, e) => {
      const target_id = e.getRelation()?.event_id;

      if (!target_id) {
        return init;
      }

      return {
        ...init,
        [target_id]: [...(init[target_id] ?? []), e],
      };
    },
    {} as Record<string, MatrixEvent[]>,
  );

export const getRedactions = (events: MatrixEvent[]) =>
  events.reduce(
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

export const formatText = (content: IContent) => {
  const inReplyTo = !!content["m.relates_to"]?.["m.in_reply_to"];
  const replacement =
    content["m.relates_to"]?.rel_type === RelationType.Replace;

  return inReplyTo && replacement
    ? content["m.new_content"].body?.split("\n\n")[1]
    : inReplyTo
    ? content.body?.split("\n\n")[1]
    : replacement
    ? content["m.new_content"].body
    : content.body;
};
