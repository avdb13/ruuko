import { EventType, MatrixEvent, MsgType } from "matrix-js-sdk";
import { extractStyles } from "../lib/helpers";
import { useContext } from "react";
import { ClientContext } from "../providers/client";
import formatEvent, { findEventType } from "../lib/eventFormatter";
import { RoomContext } from "../providers/room";
import Annotation from "./chips/Annotation";

const Message = ({ event, annotations }: { event: MatrixEvent, annotations: MatrixEvent[] }) => {
  const eventType = findEventType(event);

  switch (eventType) {
    case "text":
      return <TextMessage event={event} annotations={annotations} />;
    case "annotation":
    case "join":
    case "leave":
    case "invite":
    case "displayNameChange":
    case "avatarChange":
    case "reply":
    case "edit":
    case "redaction":
    case "unimplemented":
      return <StateMessage event={event} />;
  }
};

const StateMessage = ({ event }: { event: MatrixEvent }) => {
  const client = useContext(ClientContext);
  const { currentRoom } = useContext(RoomContext)!;

  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2 items-center">
        <img
          src={
            event.sender!.getAvatarUrl(
              client.baseUrl,
              80,
              80,
              "scale",
              true,
              true,
            ) || "/public/anonymous.jpg"
          }
          className="object-cover h-8 w-8 rounded-full self-center border-2"
        />
        <p className="italic break-all">
          {formatEvent(event, currentRoom!.getMembers().length)}
        </p>
      </li>
    </div>
  );
};

const TextMessage = ({ event, annotations }: { event: MatrixEvent, annotations: MatrixEvent[] }) => {
  const client = useContext(ClientContext);

  const isReply = !!event.getContent()["m.relates_to"]?.["m.in_reply_to"];
  if (isReply) {
    extractStyles(event.getContent().formatted_body);
  }
  const inReplyTo = <p className="border-l-2 border-slate-400 px-1">hello</p>;

  const src =
    event.sender!.getAvatarUrl(client.baseUrl, 80, 80, "scale", true, true) ||
    "/public/anonymous.jpg";

  console.log(event.getContent());

  const content = event.getContent().msgtype === MsgType.Image ? (
    // normal image
    <img src={client.mxcUrlToHttp(event.getContent().url)!} alt={event.getContent().body} />
  ) : (
    event.getContent().url ? (
      // custom sticker
      <img src={client.mxcUrlToHttp(event.getContent().url)!} alt={event.getContent().body} className="h-16 w-16" />
    ) : (
      <p className="whitespace-normal break-all">{event.getContent().body}</p>
    )
  );

  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <img
          src={src}
          className="object-cover h-16 w-16 rounded-full self-center border-2"
        />
        <div className="flex flex-col">
          <div className="flex gap-4">
            <p>{new Date(event.getTs()).toLocaleString("en-US")}</p>
          </div>
          {inReplyTo}
          {content}
          <div className="flex gap-2">
            {annotations ? annotations.map(annotation => annotation ? <Annotation annotation={annotation} /> : null) : null}
          </div>
        </div>
      </li>
    </div>
  );
};

export const DateMessage = ({ date }: { date: Date }) => {
  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <p>{date.toLocaleString("en-US")}</p>
      </li>
    </div>
  );
};

export const JoinMessage = ({ event }: { event: MatrixEvent }) => {
  const client = useContext(ClientContext);

  const content = event.getPrevContent().displayname
    ? `${event.getPrevContent().displayname} changed their display name to ${
        event.getContent().displayname
      }`
    : `${event.getContent().displayname} joined the room`;

  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <img
          src={
            event.sender!.getAvatarUrl(
              client.baseUrl,
              80,
              80,
              "scale",
              true,
              true,
            ) || "/public/anonymous.jpg"
          }
          className="object-cover h-16 w-16 rounded-full self-center border-2"
        />
        <div className="flex flex-col justify-center">
          {content}
        </div>
      </li>
    </div>
  );
};

export default Message;
