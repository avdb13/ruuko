import { useEffect, useState } from "react";
import Resizable from "./Resizable";
import { IStatusResponse, Room, RoomMember } from "matrix-js-sdk";
import Avatar from "./Avatar";
import CrossIcon from "./icons/Cross";
import Scrollbar from "./Scrollbar";

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

const MemberList = ({
  room,
  presences,
  setShowMembers,
}: {
  room: Room;
  presences: Record<string, IStatusResponse | null>;
  setShowMembers: (_: boolean) => void;
}) => {
  const [memberListWidth, setMemberListWidth] = useState(300);

  const sortedMembers = room.getMembers().sort(sortMembers);
  const admins = sortedMembers.filter((m) => m.powerLevel === 100);

  return (
    <Resizable
      width={memberListWidth}
      setWidth={setMemberListWidth}
      side="left"
      className="content-center basis-1/4"
    >
      <Scrollbar>
        <div className="flex flex-col gap-2 items-center py-2">
          <button className="self-end" onClick={() => setShowMembers(false)}>
            <CrossIcon />
          </button>
          <Avatar
            id={room.roomId}
            type="room"
            size={32}
            className="self-center"
          />
          <div className="flex gap-2">
            <p className="bg-green-400 py-1 px-4 rounded-full">public room</p>
            <p className="bg-green-400 py-1 px-4 rounded-full">encrypted</p>
          </div>
          <h1 className="text-xl font-bold">{room.name}</h1>
          <h2>{room.getDefaultRoomName()}</h2>
          <p>created by {room.getCreator()}</p>
        </div>
        <div className="basis-1/4">
          <ul className="flex flex-col">
            <button className="basis-8">invite</button>
            {admins.length > 0 ? <p>admins</p> : null}
            {admins.length > 0
              ? admins.map((m) => (
                  <MemberChip presence={presences[m.userId]} member={m} />
                ))
              : null}
            <p>members</p>
            {sortedMembers
              .filter((m) => m.powerLevel < 100)
              .map((m) => (
                <MemberChip presence={presences[m.userId]} member={m} />
              ))}
          </ul>
        </div>
      </Scrollbar>
    </Resizable>
  );
};

const MemberChip = ({
  member,
  presence,
}: {
  member: RoomMember;
  presence?: IStatusResponse;
}) => {
  return (
    <li
      className={`border-2 ${
        presence && presence.presence === "offline" ? "opacity-50" : null
      }`}
    >
      <div className="flex gap-4 items-center">
        <div className="relative">
          <Avatar id={member.userId} type="user" size={16} className="z-0" />
        </div>
        <div>
          <p>
            {member.name} {member.powerLevel}
          </p>
        </div>
      </div>
    </li>
  );
};

export default MemberList;
