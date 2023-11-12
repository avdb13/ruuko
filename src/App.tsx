import { useContext, useState } from "react";
import { ClientContext } from "./providers/client";
import { ClientEvent, Room } from "matrix-js-sdk";
import Sidebar from "./components/Sidebar";
import Spinner from "./components/Spinner";
import MessageWindow from "./components/MessageWindow";
import { RoomContext } from "./providers/room";

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
  const { currentRoom } = useContext(RoomContext)!;
  const [rooms, setRooms] = useState<Room[] | null>(null);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()));

  if (!rooms) {
    return <Spinner />;
  }

  const sortedRooms = rooms.sort((a, b) => sortRooms(a, b));

  return (
    <div className="flex">
      <Sidebar rooms={sortedRooms} />
      {currentRoom ? (
        <MessageWindow currentRoom={currentRoom} />
      ) : (
        <p>welcome</p>
      )}
    </div>
  );
};

export default App;
