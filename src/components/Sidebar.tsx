import { EventType, MatrixEvent, Room, RoomType } from "matrix-js-sdk";
import { useState, useContext, useMemo } from "react";
import { RoomContext } from "../providers/room";
import { formatEvent } from "./Message";
import Resizable from "./Resizable";
import UserPanel from "./UserPanel";
import Avatar from "./Avatar";
import Togglable from "./Togglable";
import { SearchRoomForm, SearchUserForm } from "./Search";
import { Membership } from "./Message";
import { ClientContext } from "../providers/client";

const sortRooms = (prev: number, next: number) => {
  return prev ? (next ? (next < prev ? 1 : next > prev ? -1 : 0) : 1) : -1;
};

const RoomIconWidget = ({ id }: { id: string }) => {
  const { setCurrentRoom, rooms } = useContext(RoomContext)!;

  return (
    <button
      className="flex flex-col gap-8 items-center"
      onClick={() => setCurrentRoom(rooms?.find((r) => r.roomId === id)!)}
    >
      <Avatar id={id} type="room" size={16} className="shadow-sm" />
    </button>
  );
};

const RoomWidget = ({
  id,
  name,
  personal,
}: {
  id: string;
  name: string;
  personal: boolean;
}) => {
  const { setCurrentRoom, roomEvents, rooms } = useContext(RoomContext)!;

  const events = roomEvents[id]!.filter(
    (e) =>
      e.getType() === EventType.RoomMessage ||
      e.getType() === EventType.RoomMember,
  );

  const latestEvent = events ? events[events.length - 1] : null;

  return (
    <button
      onClick={() => setCurrentRoom(rooms?.find((r) => r.roomId === id)!)}
      className="flex items-center gap-4 p-2 w-full border-b-4 shadow-md rounded-md hover:bg-indigo-200 duration-300"
      key={name}
    >
      <Avatar id={id} type="room" size={16} className="shadow-sm" />
      <div className="flex flex-col items-start min-w-0">
        <p className="max-w-full truncate font-bold">{name}</p>
        <p className="max-w-full truncate text-sm">
          {latestEvent
            ? `${
                personal
                  ? ""
                  : (latestEvent.getContent().displayname ||
                      latestEvent.getSender()) + ": "
              } ${formatEvent(latestEvent)}`
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
  personal,
}: {
  sidebarWidth: number;
  rooms: { name: string; id: string }[];
  personal?: boolean;
}) => {
  return rooms.length > 0 ? (
    <ul className="flex flex-col gap-2">
      {sidebarWidth < 120
        ? rooms.map(({ _, id }) => <RoomIconWidget id={id} key={id} />)
        : rooms.map(({ name, id }) => (
            <RoomWidget personal name={name} id={id} key={id} />
          ))}
    </ul>
  ) : null;
};

const Sidebar = () => {
  const { rooms, roomEvents } = useContext(RoomContext)!;
  const [sidebarWidth, setSidebarWidth] = useState(400);

  const getLastEvent = (r: Room) => {
    const events = roomEvents[r.roomId];
    console.log(events?.filter(e => e.getType() === EventType.Direct).map(e => e.getContent()))
    return events?.[events.length - 1]?.getTs() || 0;
  };

  const memoizedRooms = useMemo(
    () => rooms.sort((a, b) => sortRooms(getLastEvent(a), getLastEvent(b))),
    [rooms],
  );
  const memoizedFriendRooms = useMemo(
    () =>
      memoizedRooms
        .filter((r) => r.getMyMembership() === Membership.Join)
        .filter((r) => r.getMembers().length <= 2),
    [memoizedRooms],
  );
  const memoizedPublicRooms = useMemo(
    () =>
      memoizedRooms
        .filter((r) => r.getMyMembership() === Membership.Join)
        .filter((r) => r.getMembers().length > 2),
    [memoizedRooms],
  );
  const memoizedHistoricalRooms = useMemo(
    () => memoizedRooms.filter((r) => r.getMyMembership() === Membership.Ban),
    [memoizedRooms],
  );

  const getInfo = (r: Room) => ({ name: r.name, id: r.roomId });

  return (
    <Resizable
      width={sidebarWidth}
      setWidth={setSidebarWidth}
      minWidth={200}
      side="right"
      className="flex flex-col items-center gap-2 py-2 bg-opacity-25 bg-indigo-50 min-w-0 h-screen"
    >
      <div className="flex flex-col w-full overflow-y-auto scrollbar">
        <Togglable
          modal={<SearchUserForm />}
          title="direct messages"
          sidebarWidth={sidebarWidth}
        >
          <RoomList
            personal
            rooms={memoizedFriendRooms.map(getInfo)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable
          modal={<SearchRoomForm />}
          title="public rooms"
          sidebarWidth={sidebarWidth}
        >
          <RoomList
            rooms={memoizedPublicRooms.map(getInfo)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable title="historical rooms" sidebarWidth={sidebarWidth}>
          <RoomList
            rooms={memoizedHistoricalRooms.map(getInfo)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
      </div>
      <UserPanel />
    </Resizable>
  );
};

export default Sidebar;
