import { useContext } from "react";
import Sidebar from "./components/Sidebar";
import Spinner from "./components/Spinner";
import MessageWindow from "./components/MessageWindow";
import { RoomContext } from "./providers/room";
import { ClientContext } from "./providers/client";

const App = () => {
  const roomState = useContext(RoomContext);
  const client = useContext(ClientContext);
  const _ = useContext(RoomContext);

  console.log(Object.entries(roomState.roomEvents).length);

  if (!roomState || Object.entries(roomState.roomEvents).length !== client.getRooms().length) {
    return <Spinner />;
  }

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
