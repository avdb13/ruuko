import { EventType, MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useState } from "react";
import { ClientContext } from "../providers/client";

const MessageWindow = ({ currentRoom }: { currentRoom: Room }) => {
  const client = useContext(ClientContext);
  const [events, setEvents] = useState<MatrixEvent[] | null>(null);

  useEffect(() => {
    console.log("useEffect");
    client
      .scrollback(currentRoom, Number.MAX_SAFE_INTEGER)
      .then((scrollback) => {
        setEvents(scrollback.getLiveTimeline().getEvents());
      });
  }, [currentRoom]);

  if (!events) {
    return <div></div>;
  }

  console.log(events[events.length - 1].event.content.body);

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    // weird bug that gets triggered the message twice
    if (startOfTimeline || events[events.length - 1] === event) {
      return;
    }

    if (room?.roomId === currentRoom.roomId) {
      console.log("event: ", event.event.content.body);
      setEvents([...events, event]);
      console.log(events);
    }
  });

  return (
    <div className="flex flex-1 flex-col max-h-screen shrink basis-1/2 min-h-full justify-between">
      <div className="bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar">
        <MessagesWithDayBreak events={events} />
      </div>
      <InputBar roomId={currentRoom.roomId} />
    </div>
  );
};

export const MessagesWithDayBreak = ({ events }: { events: MatrixEvent[] }) => {
  const roomMessages = events.filter((event) => event.getType() === EventType.RoomMessage);

  return roomMessages.map((event, i) => {
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
