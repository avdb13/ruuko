import { EventType, NotificationCountType, ReceiptType, Room } from "matrix-js-sdk";
import { useState, useContext, useMemo, useEffect, memo } from "react";
import { RoomContext } from "../providers/room";
import { formatEvent } from "./Message";
import Resizable from "./Resizable";
import UserPanel from "./UserPanel";
import Avatar from "./Avatar";
import Togglable from "./Togglable";
import { SearchRoomForm, SearchUserForm } from "./Search";
import { Membership } from "./Message";
import { ClientContext } from "../providers/client";
import { AvatarContext } from "../providers/avatar";

const sortRooms = (prev?: number, next?: number) => {
  return prev ? (next ? (next < prev ? 1 : next > prev ? -1 : 0) : 1) : -1;
};

const RoomIconWidget = ({ id }: { id: string }) => {
  const { setCurrentRoom, rooms } = useContext(RoomContext)!;

  return (
    <button
      className="flex flex-col gap-8 items-center"
      onClick={() => setCurrentRoom(rooms?.find((r) => r.roomId === id)!)}
    >
      <Avatar id={id} kind="room" size={16} className="shadow-sm" />
    </button>
  );
};

const RoomWidget = ({
  id,
  name,
  direct,
  unread,
}: {
  id: string;
  name: string;
  direct: boolean;
  unread: number;
}) => {
  const { currentRoom, setCurrentRoom, roomEvents, rooms } = useContext(RoomContext)!;

  const messages = roomEvents[id];

  const latestMessage = messages ? messages[messages.length - 1] : null;
  const unreadFormatted =
    unread > 999 ? Math.round(unread / 100) / 10 + "k" : unread.toString();

  useEffect(() => {
    // trigger rerender on room change
  }, [currentRoom])

  return (
    <button
      onClick={() => setCurrentRoom(rooms?.find((r) => r.roomId === id)!)}
      className="flex items-center gap-4 px-4 py-2 w-full border-b-4 shadow-md rounded-md hover:bg-indigo-200 duration-300"
      key={name}
    >
      <Avatar
        id={id}
        kind="room"
        size={16}
        className="shadow-sm border-white"
      />
      <div className="flex flex-col items-start min-w-0">
        <p className="max-w-full truncate font-bold">{name}</p>
        <p className="max-w-full truncate text-sm">
          {latestMessage
            ? `${
                direct
                  ? ""
                  : (latestMessage.event.getContent().displayname ||
                      latestMessage.event.getSender()) + ": "
              } ${formatEvent(latestMessage.event)}`
            : null}
        </p>
      </div>
      <div className="flex-none flex flex-col justify-center items-center h-full">
        {unread > 0 && (
          <div className="rounded-full bg-indigo-50 shadow-sm text-xs text-gray-600 font-bold px-2">
            {unreadFormatted}
          </div>
        )}
      </div>
    </button>
  );
};

// TODO: remove rooms where the user got banned
const RoomList = ({
  sidebarWidth,
  rooms,
  direct,
}: {
  sidebarWidth: number;
  rooms: { name: string; id: string; unread: number }[];
  direct?: boolean;
}) => {
  return rooms.length > 0 ? (
    <ul className="flex flex-col gap-2">
      {sidebarWidth < 120
        ? rooms.map(({ _, id }) => <RoomIconWidget id={id} key={id} />)
        : rooms.map(({ name, id, unread }) => (
            <RoomWidget
              direct={direct ?? false}
              unread={unread}
              name={name}
              id={id}
              key={id}
            />
          ))}
    </ul>
  ) : null;
};

const Sidebar = () => {
  const { rooms, roomEvents, currentRoom } = useContext(RoomContext)!;
  const client = useContext(ClientContext);

  const [sidebarWidth, setSidebarWidth] = useState(400);

  const getLastMessage = (r: Room) => {
    const messages = roomEvents[r.roomId];
    return messages?.[messages.length - 1]?.event.getTs();
  };

  const directEvent = client.getAccountData(EventType.Direct);

  // if (!directEvent) {
  //   client.getAccountDataFromServer(EventType.Direct).then(resp => resp)
  // }

  const directRoomIds = Object.values(
    directEvent?.getContent() as Record<string, string[]>,
  ).flat();

  const arr = useMemo(() => {
    const sorted = rooms.sort(
      (a, b) =>
        // don't panic! I negated the return value here
        // because I don't wanna rewrite the sorting function.
        -sortRooms(getLastMessage(a), getLastMessage(b)),
    );

    const joined = (r: Room) => r.getMyMembership() === Membership.Join;
    const banned = (r: Room) => r.getMyMembership() === Membership.Ban;
    const direct = (r: Room) => directRoomIds.indexOf(r.roomId) >= 0;

    const getInfo = (r: Room) => ({
      name: r.name,
      id: r.roomId,
      unread: r.getUnreadNotificationCount(NotificationCountType.Total),
    });

    return [
      sorted.filter((r) => joined(r) && direct(r)),
      sorted.filter((r) => joined(r) && !direct(r)),
      sorted.filter((r) => banned(r)),
    ].map((arr) => arr.map(getInfo));
  }, [rooms,currentRoom]);
  // I hate JavaScript.
  const [directRooms, publicRooms, historicalRooms] = [
    arr[0]!,
    arr[1]!,
    arr[2]!,
  ];

  const Inner = memo(() => (
    <>
        <Togglable
          modal={<SearchUserForm />}
          title="direct messages"
          sidebarWidth={sidebarWidth}
        >
          <RoomList direct rooms={directRooms} sidebarWidth={sidebarWidth} />
        </Togglable>
        <Togglable
          modal={<SearchRoomForm />}
          title="public rooms"
          sidebarWidth={sidebarWidth}
        >
          <RoomList rooms={publicRooms} sidebarWidth={sidebarWidth} />
        </Togglable>
        <Togglable title="historical rooms" sidebarWidth={sidebarWidth}>
          <RoomList rooms={historicalRooms} sidebarWidth={sidebarWidth} />
        </Togglable>
    </>
  ));

  // TODO: full sidebar height
  return (
    <Resizable
      width={sidebarWidth}
      setWidth={setSidebarWidth}
      minWidth={200}
      side="right"
      className="flex flex-col items-center gap-2 py-2 bg-opacity-25 bg-indigo-50 min-w-0 h-screen"
    >
      <div className="flex flex-col w-full grow overflow-y-auto scrollbar">
      <Inner />
      </div>
      <UserPanel />
    </Resizable>
  );
};

export default Sidebar;
