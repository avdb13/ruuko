import React, {
  MouseEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
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
import ArrowDown from "./components/icons/ArrowDown";
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

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const startResizing = React.useCallback((mouseMoveEvent: MouseEvent) => { setIsResizing(true) }, []);
  const stopResizing = React.useCallback((mouseMoveEvent: MouseEvent) => { setIsResizing(false) }, []);

  const resize = React.useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        setSidebarWidth(
          mouseMoveEvent.clientX -
            // dunno why 30 works but it does the job.
            (sidebarRef.current! as HTMLDivElement).getBoundingClientRect().left + 30,
        );
      }
    },
    [isResizing],
  );

  React.useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
  }, [resize, stopResizing])

  return (
    <div className="flex max-h-96">
      <div
        className={`flex bg-slate-400 justify-center`}
        style={{ flexBasis: sidebarWidth }}
        id="sidebar"
        ref={sidebarRef}
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-screen">
          <div className="">
            <p>people</p>
            <ul></ul>
          </div>
          <div>
            <p>rooms</p>
            <button className="bg-red-100 h-4 w-4" onClick={() => {}}>
              <ArrowDown />
            </button>
            <ul>
              <li>a</li>
              <li>b</li>
              <li>c</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="p-1 cursor-col-resize resize-x hover:bg-slate-400" onMouseDown={startResizing}></div>
      <div
        className="flex flex-col basis-full flex-grow flex-nowrap"
        id="right-panel"
      >
        <div className="basis-12 bg-slate-600" id="header">
          <p className="flex justify-center">Room 1</p>
        </div>
    <div className="overflow-y-auto bg-green-100 scrollbar">
          <div
            className="flex flex-col basis-4/5 bg-slate-300"
            id="message-panel"
          >
            <div className="bg-slate-400">
              <ul className="flex flex-col">
                {messages.map((message) => (
                  <div className="p-2 border-x-2 border-b-2 border-black">
                    <li className="flex content-center gap-2">
                      <img
                        src="../public/avatar.jpg"
                        className="object-cover h-12 w-12 rounded-full basis-4 self-center border-2"
                      />
                      <div className="flex flex-col">
                        <div className="flex gap-4">
                          <p className="text-purple-200">author</p>
                          <p>Today at 5:08 PM</p>
                        </div>
                        <p>{message}</p>
                      </div>
                    </li>
                  </div>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <input
          className="sticky basis-24 h-[100vh] bg-slate-500"
          id="input-panel"
        />
      </div>
    </div>
  );
};

export default App;
