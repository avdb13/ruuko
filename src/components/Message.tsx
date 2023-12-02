import {
  EventType,
  IContent,
  MatrixEvent,
  MsgType,
  RoomMember,
} from "matrix-js-sdk";
import { extractAttributes } from "../lib/helpers";
import { useContext } from "react";
import { ClientContext } from "../providers/client";
import formatEvent from "../lib/eventFormatter";
import { RoomContext } from "../providers/room";
import Annotation from "./chips/Annotation";
import Avatar, { DirectAvatar } from "./Avatar";

const Message = ({
  events,
}: {
  events: MatrixEvent[];
  annotations?: Record<string, Record<string, string[]>>;
  replacements?: Record<string, IContent[]>;
}) => {
  if (events.length === 1) {
    const event = events[0]!;

    switch (event.getType()) {
      case EventType.RoomMember:
        return <MemberMessage event={event} />;
      case EventType.Reaction:
        break;
      case EventType.RoomMessage:
        return <RoomMessage events={[event]} />;
      case EventType.RoomRedaction:
      case EventType.RoomMessageEncrypted:
      case EventType.Sticker:
      case EventType.CallInvite:
      case EventType.CallCandidates:
      case EventType.CallAnswer:
      case EventType.CallHangup:
      case EventType.CallReject:
      case EventType.CallSelectAnswer:
      case EventType.CallNegotiate:
      case EventType.CallSDPStreamMetadataChanged:
      case EventType.CallSDPStreamMetadataChangedPrefix:
      case EventType.CallReplaces:
      case EventType.CallAssertedIdentity:
      case EventType.CallAssertedIdentityPrefix:
      case EventType.KeyVerificationRequest:
      case EventType.KeyVerificationStart:
      case EventType.KeyVerificationCancel:
      case EventType.KeyVerificationMac:
      case EventType.KeyVerificationDone:
      case EventType.KeyVerificationKey:
      case EventType.KeyVerificationAccept:
      // Not used directly - see READY_TYPE in VerificationRequest.
      case EventType.KeyVerificationReady:
      // use of this is discouraged https://matrix.org/docs/spec/client_server/r0.6.1#m-room-message-feedback
      case EventType.RoomMessageFeedback:
      case EventType.Reaction:
      case EventType.PollStart:
      default:
        return <StateMessage event={event} />;
    }
  } else {
    return <RoomMessage events={events} />;
  }
};

const RoomMessage = ({
  events,
  annotations,
  replacements,
}: {
  events: MatrixEvent[];
  annotations?: Record<string, Record<string, string[]>>;
  replacements?: Record<string, IContent[]>;
}) => {
  return <MessageFrame events={events} />;
};

const MessageFrame = ({
  events,
  annotations,
  replacements,
}: {
  events: MatrixEvent[];
  annotations?: Record<string, Record<string, string[]>>;
  replacements?: Record<string, MatrixEvent[]>;
}) => {
  const firstEvent = events[0]!;
  const timestamp = firstEvent.getTs();
  const userId = firstEvent.getSender()!;
  const displayName = firstEvent.getContent().displayname;

  const children = events.map((event) => (
    <MessageWithMetadata
      event={event}
      annotations={(annotations && annotations[event.getId()!]) || {}}
    />
  ));

  return (
    <div className="p-2 border-x-2 border-b-2 border-black w-full">
      <div className="flex content-center gap-2">
        <Avatar id={userId} type="user" size={16} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <p className="whitespace-normal break-all font-bold">
              {displayName || userId}
            </p>
            <p className="whitespace-normal break-all">
              {new Date(timestamp).toLocaleString("en-US")}
            </p>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

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
      <p className="whitespace-normal break-all font-bold">{member.name}</p>
      <p className="whitespace-normal break-all">{message}</p>
    </button>
  );
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
        <p className="italic whitespace-normal break-all">
          {formatEvent(event, currentRoom!.getMembers().length)}
        </p>
      </li>
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

export const MemberMessage = ({ event }: { event: MatrixEvent }) => {
  const client = useContext(ClientContext);

  const content = event.getPrevContent().displayname
    ? `${event.getPrevContent().displayname} changed their display name to ${
        event.getContent().displayname
      }`
    : `${event.getContent().displayname} joined the room`;

  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <Avatar id={event.getSender()!} size={8} type="user" />
        <p className="flex flex-col justify-center whitespace-normal break-all">
          {content}
        </p>
      </li>
    </div>
  );
};

const ContentFormatter = ({
  content,
  previousContent,
}: {
  content: IContent;
  previousContent?: IContent[];
}) => {
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
        ) : content.body ? (
          (content.body as string)
            .split("\n")
            .map((s) => <p className="whitespace-normal break-all">{s}</p>)
        ) : (
          `unsupported: ${content}`
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
    case MsgType.Emote:
    case MsgType.Notice:
    case MsgType.File:
    case MsgType.Audio:
    case MsgType.Location:
    case MsgType.Video:
    case MsgType.KeyVerificationRequest:
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

const MessageWithMetadata = ({
  event,
  annotations,
}: {
  event: MatrixEvent;
  annotations?: Record<string, string[]>;
}) => {
  const content = event.getContent();
  const isReply = !!content["m.relates_to"]?.["m.in_reply_to"]?.event_id;

  return (
    <>
      <button
        onClick={() =>
          console.log([
            event.getType(),
            event.getContent(),
            event.getId(),
            event.getRelation(),
          ])
        }
      >
        {isReply ? (
          <ContentFormatter
            content={{ ...content, body: content.body.split("\n")[2]! }}
          />
        ) : (
          <ContentFormatter content={content} />
        )}
      </button>
      <div className="flex gap-2 flex-wrap">
        {annotations
          ? Object.entries(annotations).map(([annotation, annotators]) => {
              return (
                <Annotation
                  annotation={annotation}
                  annotators={annotators}
                  eventId={event.getId()!}
                />
              );
            })
          : null}
      </div>
    </>
  );
};

export default Message;
