import { useContext } from "react";
import Sidebar from "./components/Sidebar";
import Spinner from "./components/Spinner";
import MessageWindow from "./components/MessageWindow";
import { RoomContext } from "./providers/room";
import { ClientContext } from "./providers/client";
import { useCookies } from "react-cookie";
import Login from "./components/Login";

const App = () => {
  const [cookies] = useCookies(["session"]);
  const client = useContext(ClientContext);

  const roomState = useContext(RoomContext);
  const rooms = client.getRooms().length;

  // find out how we can make this more concise, we need to check if the store is ready somehow
  if (
    !client.getSyncState() ||
    !roomState ||
    Object.entries(roomState.roomEvents).length !== rooms ||
    roomState.rooms && roomState.rooms.length !== rooms
  ) {
    return <Spinner />;
  }

  return (
    <div className="flex min-w-0 [&>*]:z-10">
      <Sidebar />
      {roomState.currentRoom ? <MessageWindow /> : <p>welcome</p>}
    </div>
  );
};

export default App;
