import { useContext, useEffect, useState } from "react";
import Home from "./Home";
import Login from "./components/Login";
import { ClientContext } from "./providers/client";
import {
  EventType,
  MatrixEvent,
  RoomMemberEvent,
  createClient,
} from "matrix-js-sdk";
import { RoomEvent } from "matrix-js-sdk/lib/models/room";
// import Sidebar from "./components/Sidebar";

const formatMessageEvent = (event: MatrixEvent) => {
  const sender = event.sender ? event.sender.name : event.getSender();
  if (event.getType() === EventType.RoomMessage) {
    return `${sender}: ${event.event.content!.body}`;
  }
};

const App = () => {
  const { client, setClient } = useContext(ClientContext)!;
  const session = localStorage.getItem("session");

  const [messages, setMessages] = useState<string[]>([]);

  // useEffect(() => {
  //   if (session && !client) {
  //     const { accessToken, baseUrl, user } = JSON.parse(session) as Session;
  //     const client = createClient({ accessToken, baseUrl, userId: user });

  //     setClient(client);
  //     client.startClient({ initialSyncLimit: 10 });
  //     console.log(client.getSyncState());
  //   }
  // });

  // useEffect(() => {
  //   if (client) {
  //     client.on(RoomEvent.Timeline, (event, room, toStartOfTimeline) => {
  //       if (toStartOfTimeline) {
  //         return;
  //       }

  //       const message = formatMessageEvent(event);
  //       if (message) {
  //         console.log(messages);
  //         setMessages([...messages, message]);
  //       }
  //     });
  //   }
  // }, [client, messages]);

  // return <div className="flex">{session ? <Home messages={messages} /> : <Login />}</div>;

  return (
    <div className="flex">
      <div className="flex basis-48 bg-slate-400 justify-center">
        <div className="flex flex-col h-screen ">
          <div className="">
            <p>people</p>
            <ul></ul>
          </div>
          <div>
            <p>rooms</p>
            <ul>
              <li>a</li>
              <li>b</li>
              <li>c</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="flex flex-col grow">
        <div className="basis-12 bg-slate-600">
        </div>
        <div className="bg-slate-300 grow">
          <ul>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;
