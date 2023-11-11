import { EventType, MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useRef, useState } from "react";
import { ClientContext } from "../providers/client";

const MessageWindow = ({ currentRoom }: { currentRoom: Room }) => {
  const client = useContext(ClientContext);
  const [events, setEvents] = useState<MatrixEvent[] | null>(null);
  const bottomDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("useEffect");
    client
      .scrollback(currentRoom, Number.MAX_SAFE_INTEGER)
      .then((scrollback) => {
        setEvents(scrollback.getLiveTimeline().getEvents());
      });
  }, [currentRoom]);

  useEffect(() => {
    if (events) {
      bottomDivRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end"
      })
    }
  }, [events]);

  if (!events) {
    return <div></div>;
  }

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    // weird bug that gets triggered the message twice
    if (startOfTimeline || events[events.length - 1] === event) {
      return;
    }

    if (room?.roomId === currentRoom.roomId) {
      console.log("event: ", event.getContent().membership);
      setEvents([...events, event]);
    }
  });

  return (
    <div className="flex flex-1 flex-col max-h-screen shrink basis-1/2 min-h-full justify-between">
      <div className="bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar">
          <MessagesWithDayBreak events={events} />
        </div>
        <InputBar roomId={currentRoom.roomId} />
        <div id="autoscroll-bottom" ref={bottomDivRef}></div>
      </div>
    </div>
  );
};

export const MessagesWithDayBreak = ({ events }: { events: MatrixEvent[] }) => {
  return events.map((event, i) => {
    if (i === 0) {
      return <Message message={event} key={i} />
    } else {
      const [messageTs, prevMessageTs] = [
        new Date(event.getTs()),
        new Date(events[i - 1].getTs()),
      ];

      return prevMessageTs.getDate() === messageTs.getDate() ? (
        <Message message={event} key={i} />
      ) : (
        <>
          <DateMessage date={messageTs} />
          <Message message={event} key={i} />
        </>
      );
    }
  })
};

export default MessageWindow;
