import { useContext, useState } from "react";
import Sidebar from "./components/Sidebar";
import MessageWindow from "./components/MessageWindow";
import { RoomContext } from "./providers/room";
import { ClientContext } from "./providers/client";

const App = () => {
  const client = useContext(ClientContext);

  const [trans, setTrans] = useState(false);
  const roomState = useContext(RoomContext);
  const rooms = client.getRooms().length;

  const loading =
    !client.getSyncState() ||
    !roomState ||
    Object.entries(roomState.roomEvents).length !== rooms ||
    (roomState.rooms && roomState.rooms.length !== rooms);

  if (loading) {
    return null;
  }
  setTimeout(() => setTrans(true), 600);

  return (
    <div className={`flex min-w-0 ${trans ? "animate-app" : "opacity-0"}`}>
      <Sidebar />
      {roomState.currentRoom ? <MessageWindow /> : <p>welcome</p>}
    </div>
  );
};

export default App;
