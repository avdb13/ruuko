import { Room } from "matrix-js-sdk";
import { useState, useContext } from "react";
import { RoomContext } from "../providers/room";
import formatEvent from "../lib/eventFormatter";
import Resizable from "./Resizable";
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
    <button
      className="flex flex-col gap-8 items-center"
      onClick={() => setCurrentRoom(room)}
    >
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
      className="flex items-center gap-4 p-2 w-full border-b-4 shadow-md rounded-md hover:bg-indigo-200 duration-300"
      key={room.name}
    >
      <Avatar id={room.roomId} type="room" size={16} />
      <div className="flex flex-col items-start min-w-0">
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

// TODO: remove rooms where the user got banned
const RoomList = ({
  sidebarWidth,
  rooms,
}: {
  sidebarWidth: number;
  rooms: Room[];
}) => {
  return <ul className="flex flex-col gap-2">{sidebarWidth < 120
    ? rooms.map((room) => <RoomIconWidget room={room} key={room.roomId} />)
    : rooms.map((room) => <RoomWidget room={room} />)}</ul>;
};

const Sidebar = () => {
  const { rooms } = useContext(RoomContext)!;

  if (!rooms) {
    return null;
  }

  const sortedRooms = rooms.sort((a, b) => sortRooms(a, b));
  const [sidebarWidth, setSidebarWidth] = useState(400);

  return (
    <Resizable
      width={sidebarWidth}
      setWidth={setSidebarWidth}
      minWidth={200}
      side="right"
      className="flex flex-col items-center gap-2 py-2 bg-opacity-50 bg-indigo-50 min-w-0 h-screen"
    >
      <div className="flex flex-col w-full overflow-y-auto scrollbar">
        <Togglable
          modal={<SearchUserForm />}
          title="friends"
          sidebarWidth={sidebarWidth}
        >
          <RoomList
            rooms={sortedRooms.filter((r) => r.getMembers().length <= 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable
          modal={<SearchRoomForm />}
          title="public rooms"
          sidebarWidth={sidebarWidth}
        >
          <RoomList
            rooms={sortedRooms.filter((r) => r.getMembers().length > 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
      </div>
      <UserPanel />
    </Resizable>

  );
};

export default Sidebar;
