import { useContext, useEffect, useState } from "react";
import Resizable from "./Resizable";
import { IStatusResponse, Room, RoomMember } from "matrix-js-sdk";
import Avatar from "./Avatar";
import { RoomContext } from "../providers/room";
import CrossNoCircleIcon from "./icons/CrossNoCircle";

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
  setVisible,
}: {
  setVisible: (_: boolean) => void;
}) => {
  const { currentRoom } = useContext(RoomContext)!;
  if (!currentRoom) {
    return null;
  }

  const [memberListWidth, setMemberListWidth] = useState(300);

  const sortedMembers = currentRoom.getMembers().sort(sortMembers);
  const admins = sortedMembers.filter((m) => m.powerLevel === 100);

  return (
    <Resizable
      width={memberListWidth}
      minWidth={150}
      setWidth={setMemberListWidth}
      side="left"
      className="flex flex-col gap-2 items-center py-2 overflow-y-auto content-center basis-1/4 grow"
    >
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
          <h2>{currentRoom.getDefaultRoomName()}</h2>
          <p>created by {currentRoom.getCreator()}</p>
    </Resizable>
  );
          // <ul className="flex flex-col">
          //   <button className="basis-8">invite</button>
          //   {admins.length > 0 ? <p>admins</p> : null}
          //   {admins.length > 0
          //     ? admins.map((m) => (
          //         <MemberChip presence={presences[m.userId]} member={m} />
          //       ))
          //     : null}
          //   <p>members</p>
          //   {sortedMembers
          //     .filter((m) => m.powerLevel < 100)
          //     .map((m) => (
          //       <MemberChip presence={presences[m.userId]} member={m} />
          //     ))}
          // </ul>
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
