import { Room } from "matrix-js-sdk";
import {
  useState,
  useContext,
} from "react";
import { RoomContext } from "../providers/room";
import formatEvent from "../lib/eventFormatter";
import Resizable from "./Resizable";
import Scrollbar from "./Scrollbar";
import UserPanel from "./UserPanel";
import Avatar from "./Avatar";
import Togglable from "./Togglable";
import { SearchRoomForm, SearchUserForm } from "./Search";

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

const RoomIconWidget = ({ room }: { room: Room }) => {
  const { setCurrentRoom } = useContext(RoomContext)!;

  return (
    <button onClick={() => setCurrentRoom(room)}>
      <Avatar id={room.roomId} type="room" size={16} />
    </button>
  );
};

const RoomWidget = ({ room }: { room: Room }) => {
  const { setCurrentRoom, roomEvents } = useContext(RoomContext)!;

  const events = Object.values(roomEvents[room.roomId] || {});
  const latestEvent = events ? events[events.length - 1] : null;

  return (
    <button
      onClick={() => setCurrentRoom(room)}
      className="flex items-center shrink gap-2 p-4 w-full border-2 rounded-md hover:bg-green-300"
      key={room.name}
    >
      <Avatar id={room.roomId} type="room" size={16} />
      <div className="flex flex-col items-start bg-green-200 min-w-0">
        <p className="max-w-full truncate font-bold">{room.name}</p>
        <p className="max-w-full truncate text-sm">
          {latestEvent
            ? formatEvent(latestEvent, room.getMembers().length)
            : null}
        </p>
      </div>
    </button>
  );
};

const RoomList = ({
  sidebarWidth,
  rooms,
}: {
  sidebarWidth: number;
  rooms: Room[];
}) => {
  return (
    <>
      {sidebarWidth < 120 ? (
        <div className="flex flex-col gap-[10px] items-center">
          {rooms.map((room) => (
            <RoomIconWidget room={room} key={room.roomId} />
          ))}
        </div>
      ) : (
        <div>
          {rooms.map((room) => (
            <RoomWidget room={room} />
          ))}
        </div>
      )}
    </>
  );
};

const Sidebar = () => {
  const { rooms } = useContext(RoomContext)!;

  if (!rooms) {
    return null;
  }

  const sortedRooms = rooms.sort((a, b) => sortRooms(a, b));
  const [sidebarWidth, setSidebarWidth] = useState(300);

  return (
    <Resizable width={sidebarWidth} setWidth={setSidebarWidth} minWidth={180} side="right">
      <Scrollbar width={sidebarWidth} minWidth={180}>
        <Togglable modal={<SearchUserForm />}
          title="friends"
          sidebarWidth={sidebarWidth}
        >
          <RoomList
            rooms={sortedRooms.filter((r) => r.getMembers().length <= 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable modal={<SearchRoomForm />}
          title="public rooms"
          sidebarWidth={sidebarWidth}
        >
          <RoomList
            rooms={sortedRooms.filter((r) => r.getMembers().length > 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
      </Scrollbar>
    {sidebarWidth > 180 ? <UserPanel /> : null}
    </Resizable>
  );
};

export default Sidebar;

