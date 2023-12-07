import {
  EventType,
  IContent,
  IEventRelation,
  MatrixEvent,
  MsgType,
} from "matrix-js-sdk";
import { extractAttributes } from "../lib/helpers";
import {
  PropsWithChildren,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ClientContext } from "../providers/client";
import { RoomContext } from "../providers/room";
import Annotation, { Annotator } from "./chips/Annotation";
import Avatar from "./Avatar";

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
    <>
      <Reply relation={event.getRelation()} />
      <Event event={event} replacements={replacements} redaction={redaction} />
      <Annotations annotations={annotations} reply_id={event.getId()!} />
    </>
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
        const historyButton = (
          <button
            onClick={() =>
              historyRef.current?.setShowHistory(
                !historyRef.current.showHistory,
              )
            }
          >
            (edited)
          </button>
        );

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

      return (
        <RoomEvent
          event={event}
          replacements={replacements}
          redaction={redaction}
        />
      );
    case EventType.Reaction:
    case EventType.RoomRedaction:
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
  const { currentRoom, roomEvents } = useContext(RoomContext)!;

  const events = roomEvents[currentRoom?.roomId!]!;
  const inReplyTo = relation?.["m.in_reply_to"]?.event_id;

  if (!inReplyTo) {
    return null;
  }

  // what happens if the replied-to event got redacted?
  // do we need to check for this?
  // const emote = original.getContent().msgtype === MsgType.Emote;
  const original = events[inReplyTo!]!;

  return (
    <div className="bg-green-200">
      <Event event={original} />
    </div>
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

  return Object.entries(annotations).map(([annotation, annotators]) => (
    <Annotation
      key={annotation}
      annotation={annotation}
      annotators={annotators}
      reply_id={reply_id}
    />
  ));
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

    useImperativeHandle(historyRef, () => ({
      showHistory,
      setShowHistory,
    }));

    return (
      <>
        {showHistory ? (
          <ul>
            {[original, ...replacements.slice(-1)].map((e) => (
              <RoomEvent key={e.getId()!} event={e} />
            ))}
          </ul>
        ) : null}
        <RoomEvent event={current} />
      </>
    );
  },
);

const RoomEvent = ({
  event,
  replacements,
  redaction,
}: {
  event: MatrixEvent;
  replacements?: MatrixEvent[];
  redaction?: MatrixEvent;
}) => {
  const client = useContext(ClientContext);
  const content = event.getContent();

  switch (content.msgtype) {
    case MsgType.Text: {
      if (
        content.formatted_body && (content.formatted_body as string).startsWith("<img")
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

      return <p className="whitespace-normal break-all"><span className="italic text-gray-600">{event.getId()}</span> <br /> {replacements ? (content.body as string).split("\n\n")[1] : content.body} </p>;
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
      return (
        null
      );
    // );
  }

  // return (
  //   <MessageFrame
  //     userId={userId}
  //     displayName={displayName}
  //     timestamp={timestamp}
  //     annotations={annotations}
  //     replacements={replacements}
  //     logs={events.map((e) => e.getContent())}
  //   >
  //     {events
  //       .filter(
  //         (e) => e.getRelation()?.rel_type !== RelationType.Replace ?? true,
  //       )
  //       .map((event) => (
  //         <Content
  //           event={event}
  //           annotations={annotations && annotations[event.getId()!]}
  //           replacements={replacements && replacements[event.getId()!]}
  //         />
  //       ))}
  //   </MessageFrame>
  // );
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
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <p className="whitespace-normal break-all font-bold">
            {props.displayName || props.userId}
          </p>
          <p className="whitespace-normal break-all">
            {new Date(props.timestamp).toLocaleString("en-US")}
          </p>
        </div>
        <div>{props.children}</div>
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
//   const element = document.getElementById(eventId);

//   const handleClick = () => {
//     if (element) {
//       element.scrollIntoView({ behavior: "smooth", block: "center" });
//       // flash the message
//     }
//   };

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
    <div className="p-2 border-x-2 border-b-2 border-black">
      <li className="flex content-center gap-2">
        <p className="break-all">{date.toLocaleString("en-US")}</p>
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
