import { IContent, MatrixEvent, MsgType, RelationType } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../providers/client";

type eventType = "text" | "annotation" | "join" | "leave" | "invite" | "displayNameChange" | "avatarChange" | "reply" | "edit" | "redaction" | "unimplemented"

const isText = (event: MatrixEvent) => {
  return !!event.getContent().body
}

const formatText = (event: MatrixEvent, members: number) => event.getContent().body ? (members <= 2 ? (
    event.getContent().body
  ) : (
    event.getSender() + ": " + event.getContent().body
  )) : null;

export const isAnnotation = (event: MatrixEvent) =>
  event.getContent()["m.relates_to"] && event.getContent()["m.relates_to"]?.rel_type === RelationType.Annotation

// find a fix to replace the key with the actual message later
const formatAnnotation = (event: MatrixEvent) =>
  `${event.getSender()} replied ${event.getContent()["m.relates_to"]?.key} to ${event.getContent()["m.relates_to"]?.event_id}`

const isJoin = (event: MatrixEvent) =>
  event.getContent().membership === "join" && Object.keys(event.getPrevContent()).length === 0

const formatJoin = (event: MatrixEvent) => `${event.getSender()} joined the room`

const isLeave = (event: MatrixEvent) => event.getContent().membership === "leave"

const formatLeave = (event: MatrixEvent) => `${event.getSender()} left the room`

// not 100% semantically correct as it also filters display name changes to the same name
const isDisplayNameChange = (event: MatrixEvent) =>
  event.getContent().membership === "join" && event.getContent().displayname !== event.getPrevContent().displayname

const formatDisplayNameChange = (event: MatrixEvent) =>
  `${event.getPrevContent().displayname} changed their display name to ${event.getContent().displayname}`

const isAvatarChange = (event: MatrixEvent) =>
  event.getContent().membership === "join" && event.getContent().avatar_url !== event.getPrevContent().avatar_url

const formatAvatarChange = (event: MatrixEvent) =>
  `${event.getContent().displayname} changed their avatar`

const formatEvent = (event: MatrixEvent, members: number) => {
  switch (true) {
    case isText(event):
      return formatText(event, members);
    case isAnnotation(event):
      return formatAnnotation(event);
    case isJoin(event):
      return formatJoin(event);
    case isLeave(event):
      return formatLeave(event);
    case isDisplayNameChange(event):
      return formatDisplayNameChange(event);
    case isAvatarChange(event):
      return formatAvatarChange(event);
    default:
      return `unimplemented: ${JSON.stringify(event.getContent())}`
  }
}

export const findEventType = (event: MatrixEvent): eventType => {
  switch (true) {
    case isText(event):
      return "text"
    case isAnnotation(event):
      return "annotation"
    case isJoin(event):
      return "join"
    case isLeave(event):
      return "leave"
    case isDisplayNameChange(event):
      return "displayNameChange"
    case isAvatarChange(event):
      return "avatarChange"
    default:
      return "unimplemented"
  }
}

export default formatEvent;
