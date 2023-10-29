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

  // const [messages, setMessages] = useState<string[]>([]);

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

  let messages = ["test", "hello", "mister"];
  messages = messages.concat(messages).concat(messages).concat(messages);

  return (
    <div className="flex max-h-96">
      <div className="flex basis-48 bg-slate-400 justify-center" id="sidebar">
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
      <div
        className="flex flex-col basis-full flex-grow flex-nowrap"
        id="right-panel"
      >
        <div className="basis-12 bg-slate-600" id="header">
          <p className="flex justify-center">Room 1</p>
        </div>
        <div className="overflow-y-auto bg-green-100 ">
          <div className="flex flex-col basis-4/5 bg-slate-300" id="message-panel">
            <div className="bg-slate-400">
              <ul className="flex flex-col border-4">
                {messages.map((message) => (
                  <div className="p-2 my-1 border-2 border-black">
                    <li>{message}</li>
                  </div>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="sticky basis-24 h-[100vh] bg-slate-500" id="input-panel">
          <input />
        </div>
      </div>
    </div>
  );
};

export default App;
