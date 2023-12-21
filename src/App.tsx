import { Suspense, lazy, useContext, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { RoomContext } from "./providers/room";

const MessageWindow = lazy(() => import("./components/MessageWindow"));

const App = () => {
  const roomState = useContext(RoomContext);

  if (!roomState) {
    return null;
  }

  return (
    <div className={`relative flex min-w-0 welcome`}>
      <Sidebar />
      {roomState.currentRoom ? <Suspense><MessageWindow /></Suspense> : null}
    </div>
  );
};

export default App;
