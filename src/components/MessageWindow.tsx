import { EventType, MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import Message from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useState } from "react";
import { ClientContext } from "../providers/client";

const MessageWindow = ({ currentRoom }: {  currentRoom: Room }) => {
  const client = useContext(ClientContext);
  const [events, setEvents] = useState<MatrixEvent[] | null>(null);

  useEffect(() => {
    setEvents(currentRoom.getLiveTimeline().getEvents());
  }, [currentRoom]);

  if (!events) {
    return <div></div>
  }

  console.log(events[events.length-1].event.content.body);

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    // weird bug that gets triggered the message twice
    if (startOfTimeline || events[events.length-1] === event) {
      return;
    }

    if (room?.roomId === currentRoom.roomId) {
      console.log("event: ", event.event.content.body);
      setEvents([...events, event]);
    }

  });

  return (
    <div className="flex flex-col basis-full flex-nowrap max-h-screen">
      <div className="basis-12 bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar grow justify-end">
        <ul className="flex flex-col bg-slate-400">
          {events
            .filter((event) => event.getType() === EventType.RoomMessage)
            .map((messageEvent, i) => <Message message={messageEvent} key={i} />)}
        </ul>
      </div>
    <InputBar roomId={currentRoom.roomId} />
    </div>
  );
};

export default MessageWindow;
