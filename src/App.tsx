import { Suspense, lazy, useContext } from "react";
import Sidebar from "./components/Sidebar";
import { RoomContext } from "./providers/room";
import { ClientContext } from "./providers/client";

const MessageWindow = lazy(() => import("./components/MessageWindow"));

const App = () => {
  const client = useContext(ClientContext);

  const roomState = useContext(RoomContext);
  const rooms = client?.getRooms().length;


  const loading =
    !client ||
    !roomState ||
    !rooms ||
    Object.entries(roomState.roomEvents).length !== rooms ||
    (roomState.rooms && roomState.rooms.length !== rooms);

  if (loading) {
    return null;
  }

  return (
    <div id="app" className={`flex min-w-0`}>
      <Sidebar />
      {roomState.currentRoom ? <Suspense><MessageWindow /></Suspense> : null}
    </div>
  );
};

export default App;
