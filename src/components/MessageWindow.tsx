import { MatrixEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RoomContext } from "../providers/room";

// const arrToMap = (events: MatrixEvent[]): Map<string, MatrixEvent> => {
//   return new Map(events.map((e) => [e.getId()!, e as MatrixEvent]));
// };

// const mapToArr = (map: Map<string, MatrixEvent>) =>
//   Array.from(map.values());

const MessageWindow = () => {
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const bottomDivRef = useRef<HTMLDivElement>(null);
  const { annotations } = useContext(RoomContext)!;
  console.log(annotations);
  const roomAnnotations = annotations[currentRoom!.roomId] || {};
  currentRoom && currentRoom.roomId ? console.log(roomEvents[currentRoom.roomId]) : null;

  const events = useMemo(
    () => roomEvents[currentRoom!.roomId] || [],
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

  return (
    <div className="flex flex-col max-h-screen basis-1/2 justify-between grow">
      <div className="bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar">
          <MessagesWithDayBreak events={events} annotations={roomAnnotations} />
        </div>
        <InputBar roomId={currentRoom.roomId} />
        <div id="autoscroll-bottom" ref={bottomDivRef}></div>
      </div>
    </div>
  );
};

export const MessagesWithDayBreak = ({ events, annotations }: { events: MatrixEvent[], annotations: Record<string, MatrixEvent[]> }) => {
  return events.map((event, i) => {
    const eventId = event.getId();
    const eventAnnotations = eventId ? annotations[eventId] || null : null;

    if (i === 0) {
      return <Message event={event} key={i} annotations={eventAnnotations} />;
    } else {
      const [messageTs, prevMessageTs] = [
        new Date(event.getTs()),
        new Date(events[i - 1]!.getTs()),
      ];

      return prevMessageTs.getDate() === messageTs.getDate() ? (
        <Message event={event} key={i} annotations={eventAnnotations} />
      ) : (
        <>
          <DateMessage date={messageTs} />
          <Message event={event} key={i} annotations={eventAnnotations} />
        </>
      );
    }
  });
};

export default MessageWindow;
