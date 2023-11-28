import { IContent, MatrixEvent, MsgType } from "matrix-js-sdk";
import { extractAttributes } from "../lib/helpers";
import { useContext } from "react";
import { ClientContext } from "../providers/client";
import formatEvent, { findEventType } from "../lib/eventFormatter";
import { RoomContext } from "../providers/room";
import Annotation from "./chips/Annotation";
import Avatar from "./Avatar";

const Reply = ({ body, event }: { body: string; event: MatrixEvent }) => {
  const message = body.substring(2).split(" ");

  return (
    <div className="border-l-2">
      <p>{event.getSender()!}</p>
      <p>{message[1]}</p>
    </div>
  );
};

const Message = ({
  event,
  annotations,
}: {
  event: MatrixEvent;
  annotations: MatrixEvent[] | null;
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

  const reply = !!content["m.relates_to"]?.["m.in_reply_to"]?.event_id;

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

  // if (content["m.relates_to"]) {
  //   console.log(roomEvents[currentRoom?.roomId!]!, content, roomEvents[currentRoom?.roomId!]![content["m.relates_to"]["m.in_reply_to"]?.event_id!])
  // }

  return (
    <div className="p-2 border-x-2 border-b-2 border-black">
      <div className="flex content-center gap-2">
        <Avatar id={event.getSender()!} type="user" size={16} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-4">
            <p>{new Date(event.getTs()).toLocaleString("en-US")}</p>
          </div>
          {reply ? (
            <>
              <Reply
                event={roomEvents[currentRoom?.roomId!]![content["m.relates_to"]?.event_id!]!}
                body={content.body.split("\n")[0]!}
              />
              <p className="whitespace-normal break-all">{content.body.split("\n")[2]!}</p>
            </>
          ) : (
            <ContentFormatter content={content.body} />
          )}

          <div className="flex gap-2">
            {groupedAnnotations
              ? Object.entries(groupedAnnotations).map(
                  ([annotation, annotators]) => (
                    <Annotation
                      annotation={annotation}
                      annotators={annotators}
                      eventId={event.getId()!}
                    />
                  ),
                )
              : null}
          </div>
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

export default Message;
