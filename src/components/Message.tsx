import {
  EventType,
  IContent,
  IEventRelation,
  MatrixEvent,
  MsgType,
  RelationType,
} from "matrix-js-sdk";
import { extractAttributes, formatText } from "../lib/helpers";
import {
  PropsWithChildren,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ClientContext } from "../providers/client";
import { RoomContext } from "../providers/room";
import Annotation, { Annotator } from "./chips/Annotation";
import Avatar from "./Avatar";
import EditIcon from "./icons/Edit";
import ReplyIcon from "./icons/Reply";
import CopyIcon from "./icons/Copy";

const Message = ({
  event,
  annotations,
  replacements,
  redaction,
}: {
  event: MatrixEvent;
  annotations?: Record<string, Annotator[]>;
  replacements?: MatrixEvent[];
  redaction?: MatrixEvent;
}) => {
  return (
    // flash message on click
    <div>
      <span id={event.getId()!} tabIndex={-1} className="peer"></span>
      <Reply relation={event.getContent()["m.relates_to"] ?? null} />
      {event.getType() === EventType.RoomMessage ? (
        <MessageOptions>
          <Event
            event={event}
            replacements={replacements}
            redaction={redaction}
          />
        </MessageOptions>
      ): (
          <Event
            event={event}
            replacements={replacements}
            redaction={redaction}
          />
      )}
      <Annotations annotations={annotations} reply_id={event.getId()!} />
    </div>
  );
};

const MessageOptions = (props: PropsWithChildren) => {
  return (
    <div className="group relative w-full peer-focus:bg-green-200 duration-300 transition-all ease-in-out bg-transparent">
      <div className="group-hover:bg-green-200 duration-100 py-[2px] px-[8px]">
        {props.children}
      </div>
      <div className="scale-75 border-2 border-zinc-400 flex gap-4 py-1 px-2 justify-center items-center duration-100 group-hover:opacity-100 opacity-0 absolute rounded-md bg-zinc-200 left-[80%] bottom-[75%]">
        <button title="edit">
          <EditIcon />
        </button>
        <button title="reply">
          <ReplyIcon />
        </button>
        <button title="copy">
          <CopyIcon />
        </button>
      </div>
    </div>
  );
};

const Event = ({
  event,
  replacements,
  redaction,
}: {
  event: MatrixEvent;
  replacements?: MatrixEvent[];
  redaction?: MatrixEvent;
}) => {
  const historyRef = useRef<HistoryHandle>(null);

  switch (event.getType()) {
    case EventType.RoomMember:
      return <MemberEvent event={event} />;
    case EventType.RoomMessage:
      if (replacements) {
        const historyButton = <></>;

        return (
          <>
            <ReplacedRoomEvent
              ref={historyRef}
              original={event}
              replacements={replacements}
            />{" "}
            {historyButton}
          </>
        );
      }

      return <RoomEvent event={event} redaction={redaction} />;
    case EventType.RoomRedaction:
      return <RedactionEvent event={event} />;
    case EventType.Reaction:
      throw new Error("impossible");

    case EventType.RoomMessageEncrypted:
    case EventType.Sticker:
      return <Sticker event={event} />;
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
    case EventType.PollStart:
    default:
      return (
        <p className="whitespace-normal break-all">
          unsupported: ${event.getType()} ${JSON.stringify(event.getContent())}
        </p>
      );
  }
};

const Reply = ({ relation }: { relation: IEventRelation | null }) => {
  const inReplyTo = relation?.["m.in_reply_to"]?.event_id;

  if (!inReplyTo) {
    return null;
  }

  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const events = roomEvents[currentRoom?.roomId!]!;

  // what happens if the replied-to event got redacted?
  // do we need to check for this?
  // const emote = original.getContent().msgtype === MsgType.Emote;
  const original = events[inReplyTo!]!;

  const handleClick = () => {
    const element = document.getElementById(inReplyTo);

    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      setTimeout(() => {
        element.blur();
      }, 300);
      setTimeout(() => {
        element.focus();
      }, 600);
      setTimeout(() => {
        element.blur();
      }, 900);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="shadow-sm px-2 py-1 border-l-4 border-white bg-green-200"
    >
      <Event event={original} />
    </button>
  );
};

const Annotations = ({
  reply_id,
  annotations,
}: {
  reply_id: string;
  annotations?: Record<string, Annotator[]>;
}) => {
  if (!annotations) {
    return null;
  }

  return (
    <div className="inline-flex justify-self-start">
      {Object.entries(annotations).map(([annotation, annotators]) => (
        <Annotation
          key={annotation}
          annotation={annotation}
          annotators={annotators}
          reply_id={reply_id}
        />
      ))}
    </div>
  );
};

const RedactionEvent = ({ event }: { event: MatrixEvent }) => {
  const { currentRoom } = useContext(RoomContext)!;

  const content = event.getContent();
  const original = currentRoom?.findEventById(content.redacts);

  return (
    <p>{`redacted by ${content.displayname || event.getSender()} ${
      content.reason ? ` (reason: ${content.reason})` : null
    }`}</p>
  );
};

const Sticker = ({ event }: { event: MatrixEvent }) => {
  const content = event.getContent();
  const client = useContext(ClientContext);

  if (!content.info) {
    return null;
  }

  return (
    <img
      src={client.mxcUrlToHttp(content.url)!}
      alt={content.body}
      height={content.info.h}
      width={content.info.w}
    />
  );
};

type ReplacedRoomEventProps = {
  original: MatrixEvent;
  replacements: MatrixEvent[];
};

type HistoryHandle = {
  showHistory: boolean;
  setShowHistory: (_: boolean) => void;
};

const ReplacedRoomEvent = forwardRef<HistoryHandle, ReplacedRoomEventProps>(
  (props, historyRef) => {
    const { original, replacements } = props;

    const current = replacements.slice(-1)[0]!;
    const [showHistory, setShowHistory] = useState(false);

    const bottomDiv = document.getElementById("bottom-div");

    useEffect(() => {
      if (bottomDiv) {
        const scroll = bottomDiv.scrollHeight - bottomDiv.clientHeight;
        bottomDiv.scrollTo(0, scroll);
      }
    }, [showHistory, bottomDiv]);

    useImperativeHandle(historyRef, () => ({
      showHistory,
      setShowHistory,
    }));

    const history = () => {
      return showHistory
        ? [
            original,
            ...(replacements.length > 1
              ? replacements.slice(0, replacements.length - 1)
              : []),
          ].map((e, i) =>
            i === 0 ? (
              <li>
                <RoomEvent key={e.getId()!} event={e} originalContent />
              </li>
            ) : (
              <li>
                <RoomEvent key={e.getId()!} event={e} />
              </li>
            ),
          )
        : null;
    };

    return (
      <>
        <div className="list-none bg-green-200">
          {showHistory ? history() : null}
        </div>
        <RoomEvent event={current} />
        <label
          onClick={() => {
            setShowHistory(!showHistory);
          }}
          className="align-top text-gray-600 hover:text-gray-900 duration-300"
        >
          {" "}
          (edited)
        </label>
      </>
    );
  },
);

const RoomEvent = ({
  event,
  originalContent = false,
}: {
  event: MatrixEvent;
  originalContent?: boolean;
}) => {
  const client = useContext(ClientContext);
  const content = originalContent
    ? event.getOriginalContent()
    : event.getContent();

  switch (content.msgtype) {
    case MsgType.Text: {
      if (
        content.formatted_body &&
        (content.formatted_body as string).startsWith("<img")
      ) {
        const attributes = extractAttributes(content.formatted_body, [
          "src",
          "alt",
        ]);

        return (
          <img
            src={
              client.mxcUrlToHttp(attributes["src"]!, 1200, 120, "scale", true)!
            }
            alt={attributes["alt"]!}
          />
        );
      }


      // check later if we can also change the event type with edits
      return <p className="inline-block whitespace-normal break-all">{formatText(content)}</p>;
    }
    case MsgType.Image:
      return (
        <img
          src={client.mxcUrlToHttp(content.url, 120, 120, "scale", true)!}
          alt={content.body}
        />
      );
    case MsgType.Emote:
      return (
        <p>
          `* ${content.displayName} ${content.body}`
        </p>
      );
    case MsgType.Notice:
    case MsgType.File:
    case MsgType.Audio:
    case MsgType.Location:
    case MsgType.Video:
    case MsgType.KeyVerificationRequest:
    default:
      // return content.url ? (
      //   <img
      //     src={client.mxcUrlToHttp(content.url)!}
      //     alt={content.body}
      //     className="h-16 w-16"
      //   />
      // ) : (
      console.log(`unsupported: `, content);
      return null;
    // );
  }
};

interface MessageFrameProps {
  userId: string;
  displayName?: string;
  timestamp: number;
}

export const MessageFrame = (props: PropsWithChildren<MessageFrameProps>) => (
  <div className="p-2 border-x-2 border-b-2 border-black w-full">
    <div className="flex content-center gap-2">
      <Avatar id={props.userId} type="user" size={16} />
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2">
          <p className="whitespace-normal break-all font-bold">
            {props.displayName || props.userId}
          </p>
          <p className="whitespace-normal break-all">
            {new Date(props.timestamp).toLocaleString("en-US")}
          </p>
        </div>
        <div className="">{props.children}</div>
      </div>
    </div>
  </div>
);

// const Reply = ({
//   eventId,
//   message,
//   member,
// }: {
//   eventId: string;
//   message: string;
//   member: RoomMember;
// }) => {

//   return (
//     <button
//       className="flex px-2 border-black gap-1 items-center ml-16 mb-2"
//       onClick={handleClick}
//     >
//       <DirectAvatar url={member.getMxcAvatarUrl()!} size={8} />
//       <p className="whitespace-normal break-all font-bold">{member.name}</p>
//       <p className="whitespace-normal break-all">{message}</p>
//     </button>
//   );
// };

export const DateMessage = ({ date }: { date: Date }) => {
  return (
    <div className="py-4 border-b-2 border-black">
      <li className="flex content-center justify-center gap-2">
        <div className="w-full h-[2px] translate-y-[500%] bg-black" />
        <p className="whitespace-nowrap px-2">
          {date.toLocaleDateString("en-US")}
        </p>
        <div className="w-full h-[2px] translate-y-[500%] bg-black" />
      </li>
    </div>
  );
};

interface StateFrameProps {
  userId: string;
}

export const StateFrame = (props: PropsWithChildren<StateFrameProps>) => (
  <div className="p-2 border-x-2 border-b-2 border-black pl-6">
    <li className="flex content-center gap-2">
      <Avatar id={props.userId} size={8} type="user" />
      <p className="flex flex-col justify-center whitespace-normal break-all">
        {props.children}
      </p>
    </li>
  </div>
);

const MemberEvent = ({ event }: { event: MatrixEvent }) => (
  <p>{formatMembership(event)}</p>
);

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
  switch (
    [previousMembership as Membership, membership as Membership].join(" ")
  ) {
    case [Membership.Invite, Membership.Invite].join(" "):
      return null;
    case [Membership.Invite, Membership.Join].join(" "):
      return `${sender} joined the room`;
    case [Membership.Invite, Membership.Leave].join(" "):
      return stateKey === event.getSender()
        ? `${sender} rejected the invite`
        : null;
    case [Membership.Invite, Membership.Ban].join(" "):
      return `${sender} was banned`;
    case [Membership.Invite, Membership.Knock].join(" "):
      return `${sender} requested permission to participate`;

    case [Membership.Join, Membership.Invite].join(" "):
      return null;
    case [Membership.Join, Membership.Join].join(" "):
      return content.avatar_url !== previousContent.avatar_url
        ? content.avatar_url && previousContent.avatar_url
          ? `${sender} changed their avatar`
          : previousContent.avatar_url
          ? `${sender} removed their avatar`
          : `${sender} set an avatar`
        : content.displayname !== previousContent.displayname
        ? content.displayname
          ? `${
              previousContent.displayname || sender
            } changed their display name to ${content.displayname}`
          : `${previousContent.displayname} removed their display name`
        : null;
    case [Membership.Join, Membership.Leave].join(" "):
      return stateKey === event.getSender()
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
      return stateKey === event.getSender()
        ? null
        : `${sender} had their participation request denied`;
    case [Membership.Knock, Membership.Ban].join(" "):
      return `${sender} was banned`;
    case [Membership.Knock, Membership.Knock].join(" "):
      return null;

    default:
      return null;
  }
};

export default Message;
