import { Suspense, lazy, useContext, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { RoomContext } from "./providers/room";
import LogoutButton from "./components/Logout";
import { ClientContext } from "./providers/client";

const MessageWindow = lazy(() => import("./components/MessageWindow"));

const App = () => {
  const client = useContext(ClientContext);
  const roomState = useContext(RoomContext);

  if (!roomState) {
    console.log("no roomState");
    return <LogoutButton />;
  }

  useEffect(() => {
    const crypto = client.getCrypto();
    console.log("crypto ready");
  }, [])

  return (
    <div className={`relative flex min-w-0 welcome`}>
      <Sidebar />
      {roomState.currentRoom ? (
        <Suspense>
          <MessageWindow />
        </Suspense>
      ) : null}
    </div>
  );
};

export default App;
