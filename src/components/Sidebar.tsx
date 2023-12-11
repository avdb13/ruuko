import { Room } from "matrix-js-sdk";
import { useState, useContext } from "react";
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
      className="flex items-center shrink gap-4 p-2 w-full border-b-4 shadow-md rounded-md hover:bg-indigo-200 duration-300"
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

const RoomList = ({
  sidebarWidth,
  rooms,
}: {
  sidebarWidth: number;
  rooms: Room[];
}) => {
  return sidebarWidth < 120
    ? rooms.map((room) => <RoomIconWidget room={room} key={room.roomId} />)
    : rooms.map((room) => <RoomWidget room={room} />);
};

const Sidebar = () => {
  const { rooms } = useContext(RoomContext)!;

  if (!rooms) {
    return null;
  }

  const sortedRooms = rooms.sort((a, b) => sortRooms(a, b));
  const [sidebarWidth, setSidebarWidth] = useState(300);

  return (
    <Resizable
      className=" shrink-0 grow-0 basis-1/2 bg-opacity-50 bg-indigo-50"
      width={sidebarWidth}
      setWidth={setSidebarWidth}
      minWidth={180}
      side="right"
    >
      <Scrollbar className="flex flex-col items-center gap-2 py-2" width={sidebarWidth} minWidth={180}>
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
      </Scrollbar>
      {sidebarWidth > 180 ? <UserPanel /> : null}
    </Resizable>
  );
};

export default Sidebar;
