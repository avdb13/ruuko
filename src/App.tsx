import { useContext } from "react";
import { Room } from "matrix-js-sdk";
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
  const roomState = useContext(RoomContext);

  if (!roomState || roomState.rooms.length === 0) {
    return <Spinner />;
  }

  const sortedRooms = roomState.rooms.sort((a, b) => sortRooms(a, b));

  return (
    <div className="flex min-w-0">
      <Sidebar />
      {roomState.currentRoom ? (
        <MessageWindow />
      ) : (
        <p>welcome</p>
      )}
    </div>
  );
};

export default App;
