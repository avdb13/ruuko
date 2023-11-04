// const formatMessageEvent = (event: MatrixEvent) => {
//   const sender = event.sender ? event.sender.name : event.getSender();
//   if (event.getType() === EventType.RoomMessage) {
//     return `${sender}: ${event.event.content!.body}`;
//   }
// };

import { createRef, useContext, useRef, useState } from "react";
import { ClientContext } from "./providers/client";
import ArrowDown from "./components/icons/ArrowDown";
import { ClientEvent, EventEmitterEvents, EventType, MatrixEvent, MatrixEventEvent, Room, RoomType } from "matrix-js-sdk";
import Sidebar from "./components/Sidebar";
import Message from "./components/Message";
import Spinner from "./components/Spinner";


const sortRooms = (prev: Room, next: Room) => {
  const prevEvents = prev.getLiveTimeline().getEvents();
  const nextEvents = next.getLiveTimeline().getEvents();

  const prevLastEvent = prevEvents[prevEvents.length - 1];
  const nextLastEvent = nextEvents[nextEvents.length - 1];

  return prevLastEvent
    ? nextLastEvent
      ? nextLastEvent.getTs() < prevLastEvent.getTs()
        ? 1
        : nextLastEvent.getTs() > prevLastEvent.getTs()
        ? -1
        : 0
      : 1
    : -1;
};

const App = () => {
  const client = useContext(ClientContext);
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()))

  if (!rooms) {
    return <Spinner />
  }

  const sortedRooms = rooms.sort((a, b) => sortRooms(a, b));

  return (
    <div className="flex">
      <Sidebar rooms={sortedRooms} setCurrentRoom={setCurrentRoom} />
      {currentRoom ? (
      <div className="flex flex-col basis-full flex-grow flex-nowrap max-h-screen">
        <div className="basis-12 bg-slate-600" id="header">
          <p className="flex justify-center">{currentRoom!.name}</p>
        </div>
        <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar grow justify-end">
          <ul className="flex flex-col bg-slate-400">
            {currentRoom
              ?.getLiveTimeline()
              .getEvents()
              .filter((event) => event.getType() === EventType.RoomMessage)
              .map((event) => <Message message={event} />)}
          </ul>
        </div>
      </div>
      ) : (
        <div>welcome</div>
      )}
    </div>
  );
};

export default App;
