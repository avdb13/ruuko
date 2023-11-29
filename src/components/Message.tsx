import { IContent, MatrixEvent, MsgType, RoomMember } from "matrix-js-sdk";
import { extractAttributes } from "../lib/helpers";
import { useContext, useRef } from "react";
import { ClientContext } from "../providers/client";
import formatEvent, { findEventType } from "../lib/eventFormatter";
import { RoomContext } from "../providers/room";
import Annotation from "./chips/Annotation";
import Avatar, { DirectAvatar } from "./Avatar";

const replyToEvent = (body: string) => {
  const split = body.substring(2).split(" ");
  const message = split[1];
  const sender = split[0] ? split[0].substring(1, split[0].length - 1) : null;

  return [sender, message];
};

const Reply = ({
  eventId,
  message,
  member,
}: {
  eventId: string;
  message: string;
  member: RoomMember;
}) => {
  const element = document.getElementById(eventId);

  const handleClick = () => {
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      // flash the message
    }
  };

  return (
    <button
      className="flex px-2 border-black gap-1 items-center ml-16 mb-2"
      onClick={handleClick}
    >
      <DirectAvatar url={member.getMxcAvatarUrl()!} size={8} />
      <p className="font-bold">{member.name}</p>
      <p>{message}</p>
    </button>
  );
};

const Message = ({
  events,
  annotations,
}: {
  events: MatrixEvent[];
  annotations: Record<string, MatrixEvent[]>;
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
  const { roomEvents, currentRoom } = useContext(RoomContext)!;

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
  annotations: MatrixEvent[] | null;
}) => {
  const { currentRoom, roomEvents } = useContext(RoomContext)!;

  const content = event.getContent();

  const isReply = !!content["m.relates_to"]?.["m.in_reply_to"]?.event_id;

  const groupedAnnotations = annotations
    ? annotations.reduce(
        (record, a) => {
          const key = a.getContent()["m.relates_to"]?.key;
          const sender = a.getSender();
          const eventId = a.getId();
          return key && sender && eventId
            ? { ...record, [key]: [...(record[key] || []), [sender, eventId]] }
            : record;
        },
        {} as Record<string, string[][]>,
      )
    : null;

  // figure out why this doesn't work later
  // const replyEvent = roomEvents[currentRoom?.roomId!]![content["m.relates_to"]?.["m.in_reply_to"]?.event_id!]!;
  // const replyEvent = currentRoom?.findEventById(content["m.relates_to"]?.["m.in_reply_to"]?.event_id!)!;

  const [sender, message] = replyToEvent(content.body.split("\n")[0]!);
  const replyMember = currentRoom?.getMember(sender!);

  return (
    <div className="p-2 border-x-2 border-b-2 border-black" id={event.getId()!}>
      <div className="flex content-center gap-2">
        <Avatar id={event.getSender()!} type="user" size={16} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <p>{new Date(event.getTs()).toLocaleString("en-US")}</p>
          </div>
          <Paragraph eventId={event.getId()!} content={content} isReply={isReply} groupedAnnotations={groupedAnnotations!} />
        </div>
      </div>
    </div>
  );
};

export const DateMessage = ({ date }: { date: Date }) => {
  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <p className="break-all">{date.toLocaleString("en-US")}</p>
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
        <p className="flex flex-col justify-center whitespace-normal break-all">
          {content}
        </p>
      </li>
    </div>
  );
};

const ContentFormatter = ({ content }: { content: IContent }) => {
  const client = useContext(ClientContext);
  const extractedAttributes = content.body
    ? extractAttributes(content.body, ["src", "alt"])
    : null;

  switch (content.msgtype) {
    case MsgType.Text: {
      if (content.format === "org.matrix.custom.html") {
        return extractedAttributes ? (
          <ContentFormatter
            content={{
              url: extractedAttributes.get("src"),
              body: extractedAttributes.get("alt"),
            }}
          />
        ) : (
          // ) : reply ? (
          //   <>
          //     <p className="border-l-2 border-slate-400 px-1 whitespace-normal break-all">
          //       {reply.in_reply_to}
          //     </p>
          //     <p className="whitespace-normal break-all">{reply.message}</p>
          //   </>
          // can contain newline
          (content.body as string)
            .split("\n")
            .map((s) => <p className="whitespace-normal break-all">{s}</p>)
        );
      }
      return <p className="whitespace-normal break-all">{content.body}</p>;
    }
    case MsgType.Image:
      return (
        <img
          src={client.mxcUrlToHttp(content.url, 120, 120, "scale", true)!}
          alt={content.body}
        />
      );
    default:
      return content.url ? (
        <img
          src={client.mxcUrlToHttp(content.url)!}
          alt={content.body}
          className="h-16 w-16"
        />
      ) : (
        <p className="whitespace-normal break-all">
          `unsupported: ${JSON.stringify(content)}`
        </p>
      );
  }
};

const Paragraph = ({
  eventId,
  replyId,
  content,
  isReply,
  groupedAnnotations,
}: {
  eventId: string;
  replyId?: string;
  content: IContent;
  isReply: boolean;
  groupedAnnotations: Record<string, string[][]>;
}) => {
  return (
    <>
      {isReply ? (
        <>
        <ContentFormatter
          content={{ ...content, body: content.body.split("\n")[2]! }}
        />
        </>
      ) : (
        <ContentFormatter content={content} />
      )}

      <div className="flex gap-2">
        {groupedAnnotations
          ? Object.entries(groupedAnnotations).map(
              ([annotation, annotators]) => (
                <Annotation
                  annotation={annotation}
                  annotators={annotators}
                  eventId={eventId}
                />
              ),
            )
          : null}
      </div>
    </>
  );
};

export default Message;
