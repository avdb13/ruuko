import { MatrixEvent } from "matrix-js-sdk";

// type messageType = "text" | "join" | "leave" | "invite" | "displayNameChange" | "avatarChange" | "reply" | "edit" | "redaction"

const isTextMessage = (event: MatrixEvent) => !!event.getContent().body

const formatTextMessage = (event: MatrixEvent, members: number) => event.getContent().body ? (members <= 2 ? (
    event.getContent().body
  ) : (
    event.getSender() + ": " + event.getContent().body
  )) : null;

const isJoinMessage = (event: MatrixEvent) =>
  event.getContent().membership === "join" && Object.keys(event.getPrevContent()).length === 0

const formatJoinMessage = (event: MatrixEvent) => `${event.getSender()} joined the room`

// not 100% semantically correct as it also filters display name changes to the same name
const isDisplayNameChangeMessage = (event: MatrixEvent) =>
  event.getContent().membership === "join" && event.getContent().displayname !== event.getPrevContent().displayname

const formatDisplayNameChangeMessage = (event: MatrixEvent) =>
  `${event.getPrevContent().displayname} changed their display name to ${event.getContent().displayname}`

const isAvatarChangeMessage = (event: MatrixEvent) =>
  event.getContent().membership === "join" && event.getContent().avatar_url !== event.getPrevContent().avatar_url

const formatAvatarChangeMessage = (event: MatrixEvent) =>
  `${event.getContent().displayname} changed their avatar`

const formatEvent = (event: MatrixEvent, members: number) => {
  switch (true) {
    case isTextMessage(event):
      return formatTextMessage(event, members);
    case isJoinMessage(event):
      return formatJoinMessage(event);
    case isDisplayNameChangeMessage(event):
      return formatDisplayNameChangeMessage(event);
    case isAvatarChangeMessage(event):
      return formatAvatarChangeMessage(event);
    default:
      return `unimplemented: ${JSON.stringify(event.getContent())}`
  }
}

export default formatEvent;
