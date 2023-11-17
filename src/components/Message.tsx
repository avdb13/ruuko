import { EventType, IContent, MatrixEvent, MsgType } from "matrix-js-sdk";
import { extractAttributes, extractStyles } from "../lib/helpers";
import { useContext } from "react";
import { ClientContext } from "../providers/client";
import formatEvent, { findEventType } from "../lib/eventFormatter";
import { RoomContext } from "../providers/room";
import Annotation from "./chips/Annotation";

const Message = ({
  event,
  annotations,
}: {
  event: MatrixEvent;
  annotations: MatrixEvent[];
}) => {
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

const TextMessage = ({
  event,
  annotations,
}: {
  event: MatrixEvent;
  annotations: MatrixEvent[];
}) => {
  const client = useContext(ClientContext);

  const isReply = !!event.getContent()["m.relates_to"]?.["m.in_reply_to"];
  if (isReply) {
    extractStyles(event.getContent().formatted_body);
  }
  const inReplyTo = <p className="border-l-2 border-slate-400 px-1">hello</p>;

  const src =
    event.sender!.getAvatarUrl(client.baseUrl, 80, 80, "scale", true, true) ||
    "/public/anonymous.jpg";

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
          <ContentFormatter content={event.getContent()} />
          <div className="flex gap-2">
            {annotations
              ? annotations.map((annotation) =>
                  annotation ? <Annotation annotation={annotation} /> : null,
                )
              : null}
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
        <div className="flex flex-col justify-center">{content}</div>
      </li>
    </div>
  );
};

        // <ContentFormatter
        //   content={{
        //     url: content.body.match(/src\s*=\s*"(.+?)"/)[1],
        //     body: content.body.match(/alt\s*=\s*"(.+?)"/)[1],
        //   }}
        // />
const ContentFormatter = ({ content }: { content: IContent }) => {
  const client = useContext(ClientContext);
  const extractedAttributes = content.body ? extractAttributes(content.body, ["src", "alt"]) : null;

  console.log(content.body);

  switch (content.msgtype) {
    case MsgType.Text:
      return content.format === "org.matrix.custom.html" ? (
        extractedAttributes ? (
          <ContentFormatter content={{url: extractedAttributes.get("src"), body: extractedAttributes.get("alt") }} />
        ) : null
      ) : (
        <p className="whitespace-normal break-all">{content.body}</p>
      );
    case MsgType.Image:
      return <img src={client.mxcUrlToHttp(content.url)!} alt={content.body} />;
    default:
      console.log(content, client.mxcUrlToHttp(content.url)!);

      return content.url ? (
        <img
          src={client.mxcUrlToHttp(content.url)!}
          alt={content.body}
          className="h-16 w-16"
        />
      ) : (
        <p>`unsupported: ${JSON.stringify(content)}`</p>
      );
  }
};

export default Message;
