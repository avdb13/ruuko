import { Suspense, lazy, useContext } from "react";
import Sidebar from "./components/Sidebar";
import { RoomContext } from "./providers/room";
import { ClientContext } from "./providers/client";
import LogoutButton from "./components/Logout";

const MessageWindow = lazy(() => import("./components/MessageWindow"));

const App = () => {
  const roomState = useContext(RoomContext);
  console.log(roomState?.rooms.length, Object.values(roomState?.roomEvents || {}).length)

  if (!roomState) {
    return <LogoutButton />;
  }

  return (
    <div id="app" className={`flex min-w-0`}>
      <Sidebar />
      {roomState.currentRoom ? <Suspense><MessageWindow /></Suspense> : null}
    </div>
  );
};

export default App;
