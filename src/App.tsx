// const formatMessageEvent = (event: MatrixEvent) => {
//   const sender = event.sender ? event.sender.name : event.getSender();
//   if (event.getType() === EventType.RoomMessage) {
//     return `${sender}: ${event.event.content!.body}`;
//   }
// };

import {
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ClientContext } from "./providers/client";
import ArrowDown from "./components/icons/ArrowDown";
import { EventType, MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import Sidebar from "./components/Sidebar";

const sortRooms = (prev: Room, next: Room) => {
  const prevEvents = prev.getLiveTimeline().getEvents();
  const nextEvents = next.getLiveTimeline().getEvents();

  const prevLastEvent = prevEvents[prevEvents.length - 1];
  const nextLastEvent = nextEvents[nextEvents.length - 1];

  return prevLastEvent
    ? nextLastEvent
      ? nextLastEvent.getTs() < prevLastEvent.getTs()
        ? 1
        : nextLastEvent.getTs() > prevLastEvent.getTs()
        ? -1
        : 0
      : 1
    : -1;
};

const App = () => {
  const messages = ["hi", "hello", "we did it reddit"];
  const client = useContext(ClientContext);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  const unsortedRooms = client.getRooms();
  const sortedRooms = unsortedRooms.sort((a, b) => sortRooms(a, b));

  // const roomAvatars = sortedRooms.map(room => room.getAvatarUrl("https://matrix.org", 80, 80, "scale") || room.name.charAt(0));

  return (
    <div className="flex max-h-96">
      <Sidebar>
        <div
          className={`flex bg-slate-400 justify-center`}
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
                {sortedRooms.map(room => <li><button onClick={() => setCurrentRoom(room)}>{room.name}</button></li>)}
              </ul>
            </div>
          </div>
        </div>
      </Sidebar>
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
                {currentRoom?.getLiveTimeline().getEvents().filter(event => event.getType() === EventType.RoomMessage).map((event) => (
                  <div className="p-2 border-x-2 border-b-2 border-black">
                    <li className="flex content-center gap-2">
                      <img
                        src={event.sender!.getAvatarUrl(client.baseUrl, 80, 80, "scale", true, true)!}
                        className="object-cover h-12 w-12 rounded-full basis-4 self-center border-2"
                      />
                      <div className="flex flex-col">
                        <div className="flex gap-4">
                          <p className="text-purple-200">{event.getSender()}</p>
                          <p>{event.getTs()}</p>
                        </div>
                        <p>{event.getContent().body}</p>
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
