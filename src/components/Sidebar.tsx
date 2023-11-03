import { Room } from "matrix-js-sdk";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";

const roomToAvatarUrl = (room: Room) =>
  room.getAvatarUrl("https://matrix.org", 80, 80, "scale", true);

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
    <div>
      {sidebarWidth < 150 ? (
        <div>
          {rooms.map((room) => (
            <button onClick={() => setCurrentRoom(room)}>
              <img
                className="h-12 w-12 rounded-full"
                src={roomToAvatarUrl(room)!}
                title={room.name}
              />
            </button>
          ))}
        </div>
      ) : (
        <div>
          {rooms.map((room) => (
            <button onClick={() => setCurrentRoom(room)} className="flex items-center gap-2 py-1">
              <img
                className="h-8 w-8 rounded-full"
                src={roomToAvatarUrl(room)!}
                title={room.name}
              />
              <p className="whitespace-nowrap">{room.name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ rooms, setCurrentRoom }: { rooms: Room[], setCurrentRoom: (_: Room) => void }) => {
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
        setSidebarWidth(mouseMoveEvent.clientX + 30);
        if (mouseMoveEvent.clientX < 120) {
          setSidebarWidth(80);
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

  return (
    <>
      <div style={{ flexBasis: sidebarWidth }} ref={sidebarRef}>
        <div
          className="flex bg-green-100 rounded-md h-screen"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col p-4">
            <div>
              <p>people</p>
              <RoomList
                rooms={rooms.filter((r) => r.getMembers().length === 2)}
                setCurrentRoom={setCurrentRoom}
                sidebarWidth={sidebarWidth}
              />
            </div>
            <div>
              <p>public rooms</p>
              <RoomList
                rooms={rooms.filter((r) => r.getMembers().length !== 2)}
                setCurrentRoom={setCurrentRoom}
                sidebarWidth={sidebarWidth}
              />
            </div>
          </div>
        </div>
      </div>
      <div
        className="p-1 cursor-col-resize resize-x"
        onMouseDown={startResizing}
      ></div>
    </>
  );
};

export default Sidebar;
