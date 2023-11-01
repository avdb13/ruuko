import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { ClientContext } from "../providers/client";

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

const Home = () => {
  const client = useContext(ClientContext);
  const [currentRoom, setCurrentRoom] = useState(null);
  const messages = ["hi", "hello", "we did it reddit!!!"];

  const unsortedRooms = client.getRooms();
  const sortedRooms = unsortedRooms.sort((a, b) => sortRooms(a, b));

  const roomAvatars = sortedRooms.map(room => room.getAvatarUrl("https://matrix.org", 80, 80, "scale") || room.name.charAt(0));

  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);
  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        setSidebarWidth(
          mouseMoveEvent.clientX -
            // dunno why 30 works but it does the job.
            (sidebarRef.current! as HTMLDivElement).getBoundingClientRect()
              .left +
            30,
        );
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

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
      <div
        className="p-1 cursor-col-resize resize-x hover:bg-slate-400"
        onMouseDown={startResizing}
      ></div>
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
  )
};
