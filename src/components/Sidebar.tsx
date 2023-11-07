import { Room } from "matrix-js-sdk";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  PropsWithChildren,
} from "react";
import Arrow from "./icons/Arrow";

const roomToAvatarUrl = (room: Room) =>
  room.getAvatarUrl("https://matrix.org", 120, 120, "scale", true);

const RoomList = ({
  sidebarWidth,
  rooms,
  setCurrentRoom,
}: {
  sidebarWidth: number;
  rooms: Room[];
  setCurrentRoom: (_: Room) => void;
}) => {
  return (
    <>
      {sidebarWidth < 120 ? (
        <div className="flex flex-col gap-[10px] items-center">
          {rooms.map((room) => (
            <button onClick={() => setCurrentRoom(room)}>
              <img
                className="h-[50px] w-[50px] rounded-full border-slate-400 border-2"
                src={roomToAvatarUrl(room)!}
                title={room.name}
              />
            </button>
          ))}
        </div>
      ) : (
        <div>
          {rooms.map((room) => (
            <button
              onClick={() => setCurrentRoom(room)}
              className="flex shrink items-center gap-2 py-1"
              key={room.name}
            >
              <img
                className="h-[50px] w-[50px] rounded-full"
                src={roomToAvatarUrl(room)!}
                title={room.name}
              />
              <p className="flex text-ellipsis">{room.name}</p>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

const Togglable = (props: PropsWithChildren<{ title: string }>) => {
  const [toggled, setToggled] = useState(true);
  const degrees = toggled ? "rotate-90" : "rotate-180";

  return (
    <div>
      <div className="flex justify-between">
        <p>{props.title}</p>
        <button className={degrees} onClick={() => setToggled(!toggled)}>
          <Arrow />
        </button>
      </div>
      {toggled ? <div>{props.children}</div> : null}
    </div>
  );
};

const Sidebar = ({
  rooms,
  setCurrentRoom,
}: {
  rooms: Room[];
  setCurrentRoom: (_: Room) => void;
}) => {
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
        setSidebarWidth(mouseMoveEvent.clientX);
        if (mouseMoveEvent.clientX < 120) {
          setSidebarWidth(60);
        }
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

  console.log(isResizing, sidebarWidth);

  return (
    <>
      <div
        className="flex flex-col basis-1/2 bg-green-100 h-screen p-4"
        onMouseDown={(e) => e.preventDefault()}
        style={{ flexBasis: sidebarWidth }}
        ref={sidebarRef}
      >
        <div>
          <Togglable title="people">
            <RoomList
              rooms={rooms.filter((r) => r.getMembers().length === 2)}
              setCurrentRoom={setCurrentRoom}
              sidebarWidth={sidebarWidth}
            />
          </Togglable>
        </div>
        <div>
          <Togglable title="public rooms">
            <RoomList
              rooms={rooms.filter((r) => r.getMembers().length !== 2)}
              setCurrentRoom={setCurrentRoom}
              sidebarWidth={sidebarWidth}
            />
          </Togglable>
        </div>
      </div>
      <div
        className="p-1 cursor-col-resize resize-x bg-green-50"
        onMouseDown={startResizing}
      ></div>
    </>
  );
};

export default Sidebar;
