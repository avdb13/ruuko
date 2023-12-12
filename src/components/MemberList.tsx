import { useContext, useEffect, useState } from "react";
import Resizable from "./Resizable";
import {
  EventType,
  IContent,
  IStatusResponse,
  Room,
  RoomMember,
} from "matrix-js-sdk";
import Avatar from "./Avatar";
import { RoomContext } from "../providers/room";
import CrossNoCircleIcon from "./icons/CrossNoCircle";
import { ClientContext } from "../providers/client";

const sortMembers = (prev: RoomMember, next: RoomMember) => {
  return prev
    ? next
      ? next.powerLevel > prev.powerLevel
        ? 1
        : next.powerLevel < prev.powerLevel
        ? -1
        : 0
      : 1
    : -1;
};

const MemberList = ({ setVisible }: { setVisible: (_: boolean) => void }) => {
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const client = useContext(ClientContext);

  if (!currentRoom) {
    return null;
  }

  const [memberListWidth, setMemberListWidth] = useState(400);
  const [presences, setPresences] = useState<Record<string, IContent>>({});

  console.log(Object.values(presences));
  useEffect(() => {
    if (currentRoom) {
      currentRoom.loadMembersIfNeeded().then((ok) => {
        if (currentRoom.membersLoaded() && ok) {
          const presences = Object.values(roomEvents[currentRoom.roomId]!)
            .filter((e) => e.getType() === EventType.Presence)
            .reduce(
              (init, e) => ({ ...init, [e.getSender()!]: e.getContent() }),
              {},
            );

          setPresences(presences);
        }
      });
    }
  }, []);

  // sort by online?
  const sortedMembers = currentRoom.getMembers().sort(sortMembers);
  const admins = sortedMembers.filter((m) => m.powerLevel === 100);

  return (
    <Resizable
      width={memberListWidth}
      minWidth={200}
      setWidth={setMemberListWidth}
      side="left"
      className="min-w-0 flex flex-col gap-2 py-4 grow h-screen"
    >
      <div className="flex flex-col items-center gap-2 grow px-4">
        <button className="self-end" onClick={() => setVisible(false)}>
          <CrossNoCircleIcon />
        </button>
        <Avatar
          id={currentRoom.roomId}
          type="room"
          size={32}
          className="self-center"
        />
        <div className="flex gap-2">
          <p className="bg-indigo-400 py-1 px-4 rounded-full">public room</p>
          <p className="bg-indigo-400 py-1 px-4 rounded-full">encrypted</p>
        </div>
        <h1 className="text-xl font-bold">{currentRoom.name}</h1>
        <h2 className="bg-gray-200 shadow-sm text-gray-800 py-1 px-4 rounded-full">
          {currentRoom.getDefaultRoomName()}
        </h2>
        <p>created by {currentRoom.getCreator()}</p>
      </div>
      <button className="capitalize font-bold border-4 py-2 rounded-md border-indigo-400 text-gray-800 border-opacity-50 bg-transparent mx-4">
        invite
      </button>
      <div className="overflow-y-scroll scrollbar">
        <ul className="flex flex-col gap-2 mx-4">
          {admins.length > 0 ? (
            <p className="font-bold capitalize text-gray-600">
              admins ({admins.length})
            </p>
          ) : null}
          {admins.length > 0
            ? admins.map((m) => (
                <MemberChip
                  presencePromise={client.getPresence(m.userId)}
                  presenceEvent={presences[m.userId]}
                  key={m.name}
                  member={m}
                />
              ))
            : null}
          <p className="font-bold capitalize text-gray-600">
            members ({sortedMembers.filter((m) => m.powerLevel < 100).length})
          </p>
          {sortedMembers
            .filter((m) => m.powerLevel < 100)
            .map((m) => (
              <MemberChip
                presencePromise={client.getPresence(m.userId)}
                presenceEvent={presences[m.userId]}
                key={m.name}
                member={m}
              />
            ))}
        </ul>
      </div>
    </Resizable>
  );
};

const MemberChip = ({
  member,
  presenceEvent,
  presencePromise,
}: {
  member: RoomMember;
  presenceEvent?: IContent;
  presencePromise: Promise<IStatusResponse>;
}) => {
  const [presence, setPresence] = useState<IStatusResponse | null>(
    (presenceEvent as IStatusResponse) ?? null,
  );
  presencePromise
    .then((resp) => {
      setPresence(resp);
    })
    .catch(() => setPresence(null));

  return (
    <li
      className={`flex gap-4 items-center min-w-0 border-b-4 p-4 rounded-md shadow-md`}
    >
      <Avatar
        id={member.userId}
        type="user"
        size={16}
        className={`${
          presence?.presence === "online" ? "border-green-200" : presence?.presence === "unavailable" ? "border-red-200" : "border-gray-200"
        }`}
      />
      <p className="truncate max-w-full">{member.name}</p>
    </li>
  );
};

export default MemberList;
