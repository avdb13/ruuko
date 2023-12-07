import {
  EventType,
  IContent,
  MatrixEvent,
  MsgType,
} from "matrix-js-sdk";
import { extractAttributes } from "../lib/helpers";
import { PropsWithChildren, useContext, useState } from "react";
import { ClientContext } from "../providers/client";
import { RoomContext } from "../providers/room";
import Annotation from "./chips/Annotation";
import Avatar from "./Avatar";

const Message = ({
  event, annotations, replacements }:{
  event: MatrixEvent;
  annotations?: Record<string, Record<string, string[]>>;
  replacements?: Record<string, IContent[]>;
}) => {
  return (
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
  )
};

const Event = ({
  event,
}: {
  event: MatrixEvent;
}) => {
    switch (event.getType()) {
      case EventType.RoomMember:
        return <MemberMessage event={event} />;
      case EventType.Reaction:
        throw new Error('impossible');
      case EventType.RoomMessage:
        return (
          <RoomMessage
            event={event}
          />
        );
      case EventType.RoomRedaction:
        throw new Error('impossible');
      case EventType.RoomMessageEncrypted:
      case EventType.Sticker:
        return <Sticker
            event={event}
          />;
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
            unsupported: ${event.getType()} $
            {JSON.stringify(event.getContent())}
          </p>
        );
    }
};

const Sticker = ({
  event,
  annotations,
}: {
  event: MatrixEvent;
  annotations?: Record<string, Record<string, string[]>>;
}) => {
  const content = event.getContent();
// ${"body":"Cute Gentoo","info":{"h":256,"mimetype":"image/webp","size":91520,"thumbnail_info":{"h":256,"mimetype":"image/webp","size":91520,"w":227},"thumbnail_url":"mxc://pixie.town/WQ25h9HBAOZyUWSqetJ4q3o0","w":227},"url":"mxc://pixie.town/WQ25h9HBAOZyUWSqetJ4q3o0"}
  const client = useContext(ClientContext);

  if (!content.info) {
    console.log(content.info);
    return null;
  }

  return (
    <Frame userId={event.getSender()!} displayName={content.displayname} timestamp={event.getTs()} annotations={annotations}>
      <img
        src={client.mxcUrlToHttp(content.url)!}
        alt={content.body}
        height={content.info.h}
        width={content.info.w}
      />
      <button
        className="border-2 border-gray-600 bg-gray-400 rounded-md px-2 my-2"
        onClick={() =>
          console.log(content.info)
        }
      >
        debug content
      </button>
    </Frame>
  );
};

const RoomMessage = ({
  event,
  // annotations,
  // replacements,
}: {
  event: MatrixEvent;
  // annotations?: Record<string, Record<string, string[]>>;
  // replacements?: Record<string, IContent[]>;
}) => {
  const client = useContext(ClientContext);

  const timestamp = event.getTs();
  const userId = event.getSender()!;
  const displayName = event.getContent().displayname;
  const content = event.getContent();

  switch (content.msgtype) {
    case MsgType.Text: {
      // if (content.format === "org.matrix.custom.html" && extractedAttributes) {
      //   return (
      //     <ContentFormatter
      //       content={{
      //         url: extractedAttributes.get("src"),
      //         body: extractedAttributes.get("alt"),
      //       }}
      //     />
      //   );
      // }

          // {inReplyTo ? (
          //   <div className="bg-green-200">
          //     {"> "}
          //     {inReplyTo[0]!
          //       .split("\n")
          //       .map((s, i) =>
          //         i === 0 ? s.split("> ", 3)[2] : s.split("> ", 2)[1],
          //       )}
          //   </div>
          // ) : null}
          // {showEdits ? edits() : null}
      return (
        <span className="whitespace-normal break-all">
          {content.body}
        </span>
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
      return `* ${content.displayName} ${content.body}`;
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
        return (
        <p className="whitespace-normal break-all">
          `unsupported: ${JSON.stringify(content)}`
        </p>
        )
      // );
  }

  // return (
  //   <Frame
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
  //   </Frame>
  // );
};

interface FrameProps {
  userId: string;
  displayName?: string;
  timestamp: number;
  annotations?: Record<string, Record<string, string[]>>;
  replacements?: Record<string, IContent[]>;
  logs?: any;
}

const Frame = (props: PropsWithChildren<FrameProps>) => (
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
          <button
            className="border-2 border-gray-600 bg-gray-400 rounded-md px-2"
            onClick={() => console.log(props.logs)}
          >
            debug frame
          </button>
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
        <p className="italic whitespace-normal break-all">{}</p>
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
    return null;
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
  );
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

const ContentFormatter = ({
  content,
  previousContent,
}: {
  content: IContent;
  previousContent?: IContent[];
}) => {
  const client = useContext(ClientContext);
  const inReplyTo = content["m.relates_to"]?.["m.in_reply_to"]?.event_id
    ? (content.body as string).split("\n\n", 2)
    : null;
  const [showEdits, setShowEdits] = useState(false);

  // we need to remove the last element since that's the latest edit
  const edits = () => (
    <ul className="bg-green-200 px-2">
      {previousContent
        ?.slice(0, -1)
        .map((content) => <ContentFormatter content={content} />)}
    </ul>
  );

  const extractedAttributes = content.body
    ? extractAttributes(content.body, ["src", "alt"])
    : null;

};

const Content = ({
  event,
  annotations,
  replacements,
}: {
  event: MatrixEvent;
  annotations?: Record<string, string[]>;
  replacements?: IContent[];
}) => {
  const content = event.getContent();

  return (
    <>
      <ContentFormatter
        content={content}
        previousContent={
          replacements
            ? [event.getOriginalContent(), ...replacements]
            : undefined
        }
      />
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
        <button
          className="border-2 border-gray-600 bg-gray-400 rounded-md px-2 my-2"
          onClick={() =>
            console.log(
              event.getContent(),
              event.getContent()["m.relates_to"]?.["m.in_reply_to"],
            )
          }
        >
          debug content
        </button>
      </div>
    </>
  );
};

export default Message;
