import { Suspense, lazy, useContext } from "react";
import Sidebar from "./components/Sidebar";
import { RoomContext } from "./providers/room";
import { ClientContext } from "./providers/client";
import { useCookies } from "react-cookie";
import LogoutButton from "./components/Logout";
import { SyncState } from "matrix-js-sdk";

const MessageWindow = lazy(() => import("./components/MessageWindow"));

const App = () => {
  const client = useContext(ClientContext);
  const roomState = useContext(RoomContext);

  const [_cookies, _setCookie, removeCookie] = useCookies(["session"]);

  const loading =
    !client.getSyncState() ||
    !roomState

  if (loading) {
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
