import { Suspense, lazy, useContext, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import { RoomContext } from "./providers/room";

const MessageWindow = lazy(() => import("./components/MessageWindow"));

const App = () => {
  const roomState = useContext(RoomContext);

  useEffect(() => console.log(roomState), [roomState])

  if (!roomState) {
    return null;
  }

  // useEffect(() => {
  //   const crypto = client.getCrypto();
  //   if  (crypto) {
  //     crypto.getCrossSigningStatus().then(status => console.log(status));
  //     crypto.getCrossSigningKeyId().then(status => console.log(status));
  //   }
  //   // if ()
  // }, [])

  console.log("ready");
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
