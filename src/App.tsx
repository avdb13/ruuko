import { useContext } from "react";
import Sidebar from "./components/Sidebar";
import MessageWindow from "./components/MessageWindow";
import { RoomContext } from "./providers/room";
import { ClientContext } from "./providers/client";

const App = () => {
  const client = useContext(ClientContext);

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

  return (
    <div className={`transition-all duration-500 ease-out flex min-w-0 ${loading ? "opacity-0 scale-150 blur-[4px]" : "opacity-100 scale-100 blur-[0px]"}`}>
      <Sidebar />
      {roomState.currentRoom ? <MessageWindow /> : <p>welcome</p>}
    </div>
  );
};

export default App;
