import { MatrixClient, MatrixEvent, RelationType } from "matrix-js-sdk";
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

interface TagContents {
  in_reply_to: string;
  message: string;
}

export const addAnnotation = (
  annotations: Record<string, Record<string, Record<string, string[]>>>,
  event: MatrixEvent,
) => {
  const roomId = event.getRoomId();
  const msgId = event.getContent()["m.relates_to"]?.event_id;
  const relation = event.getRelation();
  const key = event.getContent()["m.relates_to"]?.key!;
  const newAnnotator = event.getSender();

  if (
    !(
      roomId &&
      msgId &&
      relation &&
      relation.rel_type === RelationType.Annotation
    )
  ) {
    return annotations;
  }

  const roomAnnotations = annotations[roomId] || {};
  const messageAnnotations = roomAnnotations[msgId!] || {};
  const annotators = messageAnnotations[key] || [];

  return {
    ...annotations,
    // shouldn't be filtering here, something else is wrong
    [roomId]: {
      ...roomAnnotations,
      [msgId]: {
        ...messageAnnotations,
        [key]: annotators.find(s => s === newAnnotator) ? annotators : [...annotators, newAnnotator],
      },
    },
  };
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
