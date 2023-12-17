import { EventType, IEventRelation, MatrixEvent, MsgType } from "matrix-js-sdk";
import { extractAttributes, formatText } from "../lib/helpers";
import {
  PropsWithChildren,
  Ref,
  useContext,
  useEffect,
  useLayoutEffect,
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
import { InputContext } from "../providers/input";
import { createReplaceEvent } from "../lib/content";
import EyeIcon from "./icons/Eye";
import Modal from "./Modal";
import moment from "moment";

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
  const { setReplace, replace } = useContext(InputContext)!;

  if (event.getType() !== EventType.RoomMessage) {
    return (
      <div className="flex grow">
        <span id={event.getId()!} tabIndex={-1} className="peer"></span>
        <Reply relation={event.getContent()["m.relates_to"] ?? null} />
        <div className="flex justify-between grow">
          <Event
            event={event}
            replacements={replacements}
            redaction={redaction}
          />
          <Receipt event={event} />
        </div>
        <Annotations annotations={annotations} reply_id={event.getId()!} />
      </div>
    );
  }

  return (
    // flash message on click
    <div>
      <span id={event.getId()!} tabIndex={-1} className="peer"></span>
      <Reply relation={event.getContent()["m.relates_to"] ?? null} />
      {replace === event.getId()! ? (
        <ReplaceWindow
          setReplace={setReplace}
          userId={event.getSender()!}
          timestamp={event.getTs()}
          event={event}
        />
      ) : (
        <MessageOptions setReplace={setReplace} event={event}>
          <Event
            event={event}
            replacements={replacements}
            redaction={redaction}
          />
        </MessageOptions>
      )}
      <Annotations annotations={annotations} reply_id={event.getId()!} />
    </div>
  );
};

// TODO: some buttons are only useful for certain events, i.e. images shouldn't be edited
const MessageOptions = (
  props: PropsWithChildren<{
    event: MatrixEvent;
    setReplace: (_: string | null) => void;
  }>,
) => {
  const [copied, setCopied] = useState(false);
  const { setInReplyTo, setReplace } = useContext(InputContext)!;

  const handleEdit = () => {
    // do we need setReplace?
    setReplace(props.event.getId()!);
    props.setReplace(props.event.getId()!);
  };

  const handleReply = () => {
    setInReplyTo(props.event.getId()!);
  };

  const handleCopy = async () => {
    const text = formatText(props.event.getContent());

    if ("clipboard" in navigator) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 5000);
      });
    } else {
      document.execCommand("copy", true, text);

      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 5000);
    }
  };

  return (
    <div className="group relative w-full peer-focus:bg-indigo-200 duration-300 transition-all ease-in-out bg-transparent">
      <div className="group-hover:bg-indigo-200 group-hover:bg-opacity-50 duration-100 py-[2px] px-[8px]">
        {props.children}
      </div>
      <div className="border-2 border-zinc-400 flex gap-4 px-2 py-1 justify-center items-center duration-100 group-hover:opacity-100 opacity-0 absolute rounded-md bg-zinc-200 left-3/4 top-1 -translate-x-1/2 -translate-y-full">
        <button type="button" title="edit">
          <EditIcon className="scale-75" onClick={handleEdit} />
        </button>
        <button type="button" title="reply" onClick={handleReply}>
          <ReplyIcon className="scale-75" />
        </button>
        <button
          type="button"
          title="copy"
          onClick={handleCopy}
          className={`duration-300 transition-all ${
            copied ? "bg-indigo-200" : "bg-zinc-200"
          }`}
        >
          <CopyIcon className="scale-75" />
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
  switch (event.getType()) {
    case EventType.RoomMember:
      return <MemberEvent event={event} />;
    case EventType.RoomMessage:
      if (replacements) {
        return (
          <ReplacedRoomEvent original={event} replacements={replacements} />
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

  const { currentRoom } = useContext(RoomContext)!;

  // what happens if the replied-to event got redacted?
  // do we need to check for this?
  // const emote = original.getContent().msgtype === MsgType.Emote;
  const original = currentRoom?.findEventById(inReplyTo);

  // users might send an ID for a non-existent ID
  if (!original) {
    return null;
  }

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
      className="shadow-sm px-2 py-1 border-l-4 border-white bg-indigo-200"
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
  const content = event.getContent();

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

const ReplacedRoomEvent = (props: ReplacedRoomEventProps) => {
  const { original, replacements } = props;

  const current = replacements.slice(-1)[0]!;

  // add diff to history later
  const detailsRef = useRef<HTMLDetailsElement>(null);

  return (
    <>
      <RoomEvent event={current} />{" "}
      <details ref={detailsRef} className="group list-none">
        <summary className="text-gray-600 hover:text-gray-800 duration-300 list-none cursor-pointer">
          {detailsRef.current?.open ? "close" : "(edited)"}
        </summary>
        <ul className="block">
          {[
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
          )}
        </ul>
      </details>
    </>
  );
};

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
      if (content.formatted_body) {
        if ((content.formatted_body as string).search("<img") > 0) {
          const attributes = extractAttributes(content.formatted_body, [
            "src",
            "alt",
          ]);
          const start = (content.formatted_body as string).indexOf("<img");

          if (start > 0) {
            return (
              <p className="inline-block whitespace-normal break-all">
                {formatText({
                  ...content,
                  body: content.body.slice(0, start),
                })}{" "}
                <img
                  src={
                    client.mxcUrlToHttp(
                      attributes["src"]!,
                      1200,
                      1200,
                      "scale",
                      true,
                    )!
                  }
                  className="inline-block"
                  height={32}
                  width={32}
                />
              </p>
            );
          } else {
            return (
              <img
                src={
                  client.mxcUrlToHttp(
                    attributes["src"]!,
                    1200,
                    1200,
                    "scale",
                    true,
                  )!
                }
                className="inline-block"
                alt={attributes["alt"]!}
                height={64}
                width={64}
              />
            );
          }
        } else {
          return (
            <p className="inline-block whitespace-normal break-all">
              {formatText(content)}
            </p>
          );
        }
      }

      // check later if we can also change the event type with edits
      return (
        <p className="inline-block whitespace-normal break-all">
          {formatText(content)}
        </p>
      );
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
      // console.log(`unsupported: `, content);
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
  <li className="p-2 w-full">
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
  </li>
);

export const ReplaceWindow = (
  props: MessageFrameProps & {
    event: MatrixEvent;
    setReplace: (_: string | null) => void;
  },
) => {
  const content = props.event.getContent();

  const client = useContext(ClientContext);
  const { currentRoom } = useContext(RoomContext)!;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newBody, setNewBody] = useState(formatText(content));

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();

    const replacement = createReplaceEvent(newBody, props.event.getId()!);

    client.sendMessage(currentRoom!.roomId, replacement);

    props.setReplace(null);
  };

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height =
        Math.max(textareaRef.current.scrollHeight, 24) + "px";
    }
  }, [newBody]);

  return (
    <div className="relative -translate-x-[80px] p-2 w-full">
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
          <textarea
            onKeyDown={(e) =>
              e.key === "Enter" && e.shiftKey ? handleSubmit(e) : null
            }
            ref={textareaRef}
            className="resize-none outline-none min-h-[24px] w-full"
            rows={1}
            onChange={(e) => setNewBody(e.target.value)}
            value={newBody}
          />
          <div className="flex gap-2">
            <button onClick={() => props.setReplace(null)} type="button">
              cancel
            </button>
            <button type="button" onClick={handleSubmit}>
              save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    <li className="py-4">
      <div className="flex content-center justify-center gap-2">
        <div className="w-full h-[2px] translate-y-[500%] bg-slate-400" />
        <p className="whitespace-nowrap px-2">
          {date.toLocaleDateString("en-US")}
        </p>
        <div className="w-full h-[2px] translate-y-[500%] bg-slate-400" />
      </div>
    </li>
  );
};

interface StateFrameProps {
  userId: string;
}

export const StateFrame = (props: PropsWithChildren<StateFrameProps>) => (
  <li className="p-2 border-black">
    <div className="flex content-center gap-2">
      <div className="px-4">
        <Avatar id={props.userId} size={8} type="user" />
      </div>
      <div className="flex flex-col justify-center whitespace-normal break-all grow px-2">
        {props.children}
      </div>
    </div>
  </li>
);

const MemberEvent = ({ event }: { event: MatrixEvent }) => (
  <div className="member">{formatMembership(event)}</div>
);

export const formatEvent = (event: MatrixEvent) => {
  switch (event.getType()) {
    case EventType.RoomMember:
      return formatMembership(event);
    case EventType.RoomMessage:
      return formatText(event.getContent());
    default:
      return "";
  }
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

const Receipt = ({ event }: { event: MatrixEvent }) => {
  const [visible, setVisible] = useState(false);

  const { currentRoom } = useContext(RoomContext)!;
  const receipts = currentRoom?.getReceiptsForEvent(event);

  if (!receipts || receipts.length === 0) {
    return null;
  }

  return (
    <>
      <Modal
        title="read by"
        visible={visible}
        setVisible={setVisible}
        className="scrollbar overflow-y-auto h-1/2"
      >
        <ul className="flex flex-col gap-2 p-4">
          {receipts.map((r) => (
            <li className="flex items-center justify-between p-2 rounded border-2 border-gray-400">
              <div>
              <p className="text-gray-800">{r.userId}</p>
              <p className="text-xs text-gray-600">{moment(r.data.ts).fromNow()}</p>
              </div>
              <Avatar
                id={r.userId}
                type="user"
                size={12}
                className="border-none shadow-sm"
              />
            </li>
          ))}
        </ul>
      </Modal>
      <button
        onClick={() => setVisible(true)}
        className="relative group shrink"
      >
        <span className="font-bold rounded-full gap-[1px] flex justify-center items-center text-gray-600 scale-75">
          {receipts.length}
          <EyeIcon className="fill-current scale-[70%]" />
        </span>
      </button>
    </>
  );
};

export default Message;
