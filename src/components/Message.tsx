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
import { RoomContext } from "../providers/room";
import Annotation from "./chips/Annotation";
import Avatar, { DirectAvatar } from "./Avatar";

const Message = ({
  events,
  annotations,
  replacements,
}: {
  events: MatrixEvent[];
  annotations?: Record<string, Record<string, string[]>>;
  replacements?: Record<string, IContent[]>;
}) => {
  if (events.length === 1) {
    const event = events[0]!;

    switch (event.getType()) {
      case EventType.RoomMember:
        console.log(formatMembership(event));
        return <MemberMessage event={event} />;
      case EventType.Reaction:
        break;
      case EventType.RoomMessage:
        return <RoomMessage events={[event]} annotations={annotations} replacements={replacements} />;
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
        return <p>unsupported: ${event.getType()} ${JSON.stringify(event.getContent())}</p>
    }
  } else {
    return <RoomMessage events={events} annotations={annotations} replacements={replacements} />;
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
  const firstEvent = events[0]!;
  const timestamp = firstEvent.getTs();
  const userId = firstEvent.getSender()!;
  const displayName = firstEvent.getContent().displayname;

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
          <div>
            {events.map((event) => (
              <Content
                event={event}
                annotations={annotations && annotations[event.getId()!]}
                replacements={replacements && replacements[event.getId()!]}
              />
            ))}
          </div>
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
          {}
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
  const content = formatMembership(event);

  if (!content) {
    console.log(event.getContent(), event.getPrevContent())
    // return null;
  }

  return (
    <div className="p-2 border-x-2 border-b-2 border-black pl-6">
      <li className="flex content-center gap-2">
        <Avatar id={event.getSender()!} size={8} type="user" />
        <p className="flex flex-col justify-center whitespace-normal break-all">
          {content}
        </p>
      </li>
    </div>
  )
};

export enum Membership {
  Invite = "invite",
  Join = "join",
  Leave = "leave",
  Ban = "ban",
  Knock = "knock",
}

const formatMembership = (event: MatrixEvent) => {
  let content = event.getContent();
  let previousContent = event.getPrevContent();

  let membership = content.membership;
  let previousMembership = previousContent.membership;

  const stateKey = event.getStateKey();
  const sender = content.displayname || event.getSender();

  const isValid = (s: string) =>
    Object.values(Membership).some((m) => (m as string) === s);

  if (!membership) {
    return null;
  }

  if (!previousMembership && membership && isValid(membership)) {
    switch (membership as Membership) {
      case Membership.Invite:
        return `${sender} invited ${stateKey}`;
      case Membership.Join:
        return `${sender} joined the room`;
      case Membership.Leave:
        return null;
      case Membership.Ban:
        return `${sender} got banned`;
      case Membership.Knock:
        return `${sender} requested permission to participate`;
    }
  }

  // hack because we can't switch on tuples
  switch ([previousMembership as Membership, membership as Membership].join(" ")) {
    case [Membership.Invite, Membership.Invite].join(" "):
      return null;
    case [Membership.Invite, Membership.Join].join(" "):
      return `${sender} joined the room`;
    case [Membership.Invite, Membership.Leave].join(" "):
      return stateKey === sender ? `${sender} rejected the invite` : null;
    case [Membership.Invite, Membership.Ban].join(" "):
      return `${sender} was banned`;
    case [Membership.Invite, Membership.Knock].join(" "):
      return `${sender} requested permission to participate`;

    case [Membership.Join, Membership.Invite].join(" "):
      return null;
    case [Membership.Join, Membership.Join].join(" "):
      return content.avatar_url !== previousContent.avatar_url
        ? content.avatar_url ?  `${sender} changed their avatar` : `${sender} removed their avatar`
        : content.displayname !== previousContent.displayname
        ? content.displayname
          ? `${
              previousContent.displayname || sender
            } changed their display name to ${content.displayname}`
          : `${previousContent.displayname} removed their display name`
        : null;
    case [Membership.Join, Membership.Leave].join(" "):
      return stateKey === sender
        ? `${sender} left the room`
        : `${sender} got kicked`;
    case [Membership.Join, Membership.Ban].join(" "):
      return `${sender} was kicked and banned`;
    case [Membership.Invite, Membership.Knock].join(" "):
      return null;

    case [Membership.Leave, Membership.Invite].join(" "):
      return null;
    case [Membership.Leave, Membership.Join].join(" "):
      return `${sender} joined the room`;
    case [Membership.Leave, Membership.Leave].join(" "):
      return null;
    case [Membership.Leave, Membership.Ban].join(" "):
      return `${sender} was banned`;
    case [Membership.Leave, Membership.Knock].join(" "):
      return `${sender} requested permission to participate`;

    case [Membership.Ban, Membership.Invite].join(" "):
      return null;
    case [Membership.Ban, Membership.Join].join(" "):
      return null;
    case [Membership.Ban, Membership.Leave].join(" "):
      return `${sender} was unbanned`;
    case [Membership.Ban, Membership.Ban].join(" "):
      return null;
    case [Membership.Ban, Membership.Knock].join(" "):
      return null;

    case [Membership.Knock, Membership.Invite].join(" "):
      return `${sender} join the room`;
    case [Membership.Knock, Membership.Join].join(" "):
      return null;
    case [Membership.Knock, Membership.Leave].join(" "):
      return stateKey !== sender
        ? `${sender} had their participation request denied`
        : null;
    case [Membership.Knock, Membership.Ban].join(" "):
      return `${sender} was banned`;
    case [Membership.Knock, Membership.Knock].join(" "):
      return null;

    default:
      return null;
  }
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

const Content = ({
  event,
  annotations,
  replacements,
}: {
  event: MatrixEvent;
  annotations?: Record<string, string[]>;
  replacements?: Record<string, IContent[]>;
}) => {
  const content = event.getContent();
  const isReply = !!content["m.relates_to"]?.["m.in_reply_to"]?.event_id;

  return (
    <>
      <button onClick={() => console.log(event.getType(), event, content)}>
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
