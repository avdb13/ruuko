import { EventType, MatrixEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef } from "react";
import { RoomContext } from "../providers/room";
import MembersIcon from "./icons/Members";
import MemberList from "./MemberList";
import Avatar from "./Avatar";
import { ClientContext } from "../providers/client";

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
}

const MessageWindow = () => {
  // no idea why roomEvents doesn't contain replies.
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const bottomDivRef = useRef<HTMLDivElement>(null);
  const { annotations } = useContext(RoomContext)!;
  const roomAnnotations = annotations[currentRoom!.roomId] || {};

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
  currentRoom.loadMembersIfNeeded();
  const client = useContext(ClientContext);

  return (
    <div className="flex flex-col max-h-screen basis-1/2 justify-between grow">
      <div className="flex basis-8 justify-between items-center text-white bg-slate-600 px-4" id="header">
        <p className="whitespace-normal break-all">{currentRoom.name}</p>
        <div>
          <button className="invert" onClick={() => {}}><MembersIcon /></button>
        </div>
      </div>
      <div className="flex max-h-screen">
        <div className="overflow-y-auto">
          <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar">
            <MessagesWithDayBreak events={events} annotations={roomAnnotations} />
          </div>
          <InputBar roomId={currentRoom.roomId} />
          <div id="autoscroll-bottom" ref={bottomDivRef}></div>
        </div>
        <div className="basis-1/4">
          <ul className="flex flex-col">
            <button className="basis-8">invite</button>
            {currentRoom.getMembers().map(m => <li className="border-2">
            <div className="flex items-center">
              <Avatar id={m.userId} type="user" size={16} />
              <div>
                <p>{m.name}</p>
                <p>{client.getPresence(m.userId).then(x => x.presence)}</p>
              </div>
            </div>
            </li>)}</ul>
        </div>
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
        return [{[k]: v} as Record<string, MatrixEvent>]
      }

      const diff = v.getTs() - eventEntries[i - 1]![1].getTs();
      const sameSender = v.getSender() === eventEntries[i - 1]![1].getSender();

      const res = diff < 60*1000 && sameSender && v.getType() == EventType.RoomMessage ? [...init.splice(0, init.length-1), ({...init[init.length-1], [k]: v})] : [...init, ({[k]: v})];

      return res;
    }, [] as Record<string, MatrixEvent>[]
  );

  return eventsGroupedByTime.map((events, i) => {
      if (i === 0) {
        return <Message events={Object.values(events)} key={i} annotations={annotations} />;
      } else {
        return <Message events={Object.values(events)} key={i} annotations={annotations} />
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

export default MessageWindow;
