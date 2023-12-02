import { EventType, IStatusResponse, MatrixEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RoomContext } from "../providers/room";
import MembersIcon from "./icons/Members";
import MemberList from "./MemberList";
import Avatar from "./Avatar";
import { ClientContext } from "../providers/client";
import Resizable from "./Resizable";

const groupAnnotations = () => {
  //   const groupedAnnotations = annotations
  //     ? annotations.reduce(
  //         (record, a) => {
  //           const key = a.getContent()["m.relates_to"]?.key;
  //           const sender = a.getSender();
  //           const eventId = a.getId();
  //           return key && sender && eventId
  //             ? { ...record, [key]: [...(record[key] || []), [sender, eventId]] }
  //             : record;
  //         },
  //         {} as Record<string, string[][]>,
  //       )
  //     : null;
};

const MessageWindow = () => {
  // no idea why roomEvents doesn't contain replies.
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const bottomDivRef = useRef<HTMLDivElement>(null);
  const { annotations } = useContext(RoomContext)!;
  const roomAnnotations = annotations[currentRoom!.roomId] || {};
  const [presences, setPresences] = useState<
    Record<string, IStatusResponse | null>
  >({});
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (currentRoom) {
      currentRoom.loadMembersIfNeeded().then((ok) => {
        if (currentRoom.membersLoaded() && ok) {
          const users = currentRoom.getMembers().map((m) => m.userId);
          console.log(users.length);

          for (let user of users) {
            console.log("presence", Object.values(presences).length);
            client
              .getPresence(user)
              .then((resp) => setPresences({ ...presences, [user]: resp }))
              .catch(() => setPresences({ ...presences, [user]: null }));
          }
        }
      });
    }
  }, []);

  const events = useMemo(
    () => roomEvents[currentRoom!.roomId] || {},
    [currentRoom, roomEvents],
  );

  useEffect(() => {
    if (events) {
      if (bottomDivRef) {
        bottomDivRef.current.scrollIntoView({
          behavior: "instant",
          block: "end",
        });
      }
    }
  }, [events, bottomDivRef]);

  if (!events || !currentRoom) {
    return <div></div>;
  }
  const client = useContext(ClientContext);

  return (
    <div className="basis-1/2 justify-between grow">
      <div className="flex max-h-screen">
        <div className="flex flex-col">
          <TitleBar showMembers={showMembers} setShowMembers={setShowMembers} roomName={currentRoom.name} />
          <div className="overflow-y-auto bg-green-100 scrollbar">
            <MessagesWithDayBreak
              events={events}
              annotations={roomAnnotations}
            />
          </div>
          <InputBar roomId={currentRoom.roomId} />
          <div id="autoscroll-bottom" ref={bottomDivRef}></div>
        </div>
        {showMembers ? (
          <MemberList
            room={currentRoom}
            presences={presences}
            setShowMembers={setShowMembers}
          />
        ) : null}
      </div>
    </div>
  );
};

export const MessagesWithDayBreak = ({
  events,
  annotations,
}: {
  events: Record<string, MatrixEvent>;
  annotations: Record<string, Record<string, string[]>>;
}) => {
  const eventEntries = Object.entries(events);

  const eventsGroupedByTime = eventEntries.reduce(
    (init, [k, v], i) => {
      if (i === 0) {
        return [{ [k]: v } as Record<string, MatrixEvent>];
      }

      const diff = v.getTs() - eventEntries[i - 1]![1].getTs();
      const sameSender = v.getSender() === eventEntries[i - 1]![1].getSender();

      const res =
        diff < 60 * 1000 && sameSender && v.getType() == EventType.RoomMessage
          ? [
              ...init.splice(0, init.length - 1),
              { ...init[init.length - 1], [k]: v },
            ]
          : [...init, { [k]: v }];

      return res;
    },
    [] as Record<string, MatrixEvent>[],
  );

  return eventsGroupedByTime.map((events, i) => {
    if (i === 0) {
      return (
        <Message
          events={Object.values(events)}
          key={i}
          annotations={annotations}
        />
      );
    } else {
      return (
        <Message
          events={Object.values(events)}
          key={i}
          annotations={annotations}
        />
      );
      // const [messageTs, prevMessageTs] = [
      //   new Date(eventEntries[eventEntries.length-1]![1].getTs()),
      //   new Date(eventEntries[0]![1].getTs()),
      // ];

      // return prevMessageTs.getDate() === messageTs.getDate() ? (
      //   <Message event={event} key={i} annotations={eventAnnotations} />
      // ) : (
      //   <>
      //     <DateMessage date={messageTs} />
      //     <Message event={event} key={i} annotations={eventAnnotations} />
      //   </>
      // );
    }
  });
};

const TitleBar = ({
  roomName,
  showMembers,
  setShowMembers,
}: {
  roomName: string;
  showMembers: boolean;
  setShowMembers: (_: boolean) => void;
}) => {
  return (
  <div
    className="flex basis-8 justify-between items-center text-white bg-slate-600 px-4"
    id="header"
  >
    <p className="whitespace-normal break-all">{roomName}</p>
    <div>
      <button className="invert" onClick={() => setShowMembers(!showMembers)}>
        <MembersIcon />
      </button>
    </div>
  </div>
  )
};

export default MessageWindow;
