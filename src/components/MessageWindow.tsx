import { EventType, MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import Message from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useState } from "react";
import { ClientContext } from "../providers/client";

const SECONDS_IN_DAY = 86400;

const MessageWindow = ({ currentRoom }: {  currentRoom: Room }) => {
  const client = useContext(ClientContext);
  const [events, setEvents] = useState<MatrixEvent[] | null>(null);

  useEffect(() => {
    console.log("useEffect");
    client.scrollback(currentRoom, Number.MAX_SAFE_INTEGER).then(scrollback => {
      setEvents(scrollback.getLiveTimeline().getEvents());
    });
  }, [currentRoom]);

  if (!events) {
    return <div></div>
  }

  console.log(events[events.length-1].event.content.body);

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    console.log("Timeline");
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
    <div className="flex flex-1 flex-col max-h-screen shrink basis-1/2">
      <div className="bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar justify-end">
        <ul>
          {events
            .filter((event) => event.getType() === EventType.RoomMessage)
            .map((event, i) => {
              return events[i-1]?.getTs() % SECONDS_IN_DAY !== events[i].getTs() % SECONDS_IN_DAY ?
                <Message message={event} key={i} /> : (
                  <>
                    <p>{new Date(event.getTs()).toLocaleString("en-US")}</p>
                    <Message message={event} key={i} />
                  </>
                )
            })}
        </ul>
      </div>
      <InputBar roomId={currentRoom.roomId} />
    </div>
  );
};

export default MessageWindow;
