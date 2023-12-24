import { Suspense, lazy, useContext, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { RoomContext } from "./providers/room";
import { ClientContext } from "./providers/client";

const MessageWindow = lazy(() => import("./components/MessageWindow"));

const App = () => {
  const client = useContext(ClientContext);
  const roomState = useContext(RoomContext);

  if (!roomState) {
    return null;
  }

  useEffect(() => {
    const crypto = client.getCrypto();
    if  (crypto) {
      crypto.getCrossSigningStatus().then(status => console.log(status));
      crypto.getCrossSigningKeyId().then(status => console.log(status));
    }
    console.log(crypto?.bootstrapCrossSigning({}))
    // if ()
  }, [])

  console.log("ready");
  return (
    <div className={`relative flex min-w-0 welcome`}>
      <Sidebar />
      {roomState.currentRoom ? <Suspense><MessageWindow /></Suspense> : null}
    </div>
  );
};

export default App;
