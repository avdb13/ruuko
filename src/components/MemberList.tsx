import { useContext, useEffect, useRef, useState } from "react";
import Resizable from "./Resizable";
import {
  IContent,
  IStatusResponse,
  RoomMember,
} from "matrix-js-sdk";
import Avatar from "./Avatar";
import { RoomContext } from "../providers/room";
import CrossNoCircleIcon from "./icons/CrossNoCircle";
import Modal from "./Modal";
import moment from "moment";

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
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: (_: boolean) => void;
}) => {
  const { currentRoom } = useContext(RoomContext)!;

  const [query, setQuery] = useState("");

  const [memberListWidth, setMemberListWidth] = useState(400);
  const [presences, setPresences] = useState<Record<string, IContent>>({});

  const [members, setMembers] = useState<RoomMember[]>([]);

  useEffect(() => {
    if (currentRoom) {
      setMembers(currentRoom.getMembers());

      // TODO: make re-rendering smoother
      if (!currentRoom.membersLoaded()) {
        currentRoom.loadMembersIfNeeded().then(ok => {
          setMembers(currentRoom.getMembers())
        })
      }
    }
  }, [currentRoom?.roomId]);

  if (!(currentRoom && visible)) {
    return null;
  }

  const admins = members
    .filter((m) => m.powerLevel === 100)
    .filter((r) =>
      query.length > 0
        ? 0 < r.name.toLowerCase().search(query) ||
          0 < r.rawDisplayName.toLowerCase().search(query)
        : r,
    )

  const regulars = members
    .filter((m) => m.powerLevel !== 100)
    .sort(sortMembers)
    .filter((r) =>
      query.length > 0
        ? 0 < r.name.toLowerCase().search(query) ||
          0 < r.rawDisplayName.toLowerCase().search(query)
        : r,
    )

  return (
    <Resizable
      width={memberListWidth}
      minWidth={200}
      setWidth={setMemberListWidth}
      side="left"
      className="isolate min-w-0 flex flex-col gap-8 py-4 grow h-screen items-center"
    >
      <div className="w-full flex flex-col items-center gap-2 px-4">
        <button className="self-end" onClick={() => setVisible(false)}>
          <CrossNoCircleIcon />
        </button>
        <Avatar
          id={currentRoom.roomId}
          type="room"
          size={32}
          className="self-center shadow-sm my-2"
        />

        <div className="text-center [&>*]:py-1">
          <h1 className="text-xl font-bold">{currentRoom.name}</h1>
          {currentRoom.getMembers().length > 2 ? (
            <h2 className="bg-gray-200 shadow-sm text-gray-800 px-4 rounded-full">
              {currentRoom.getDefaultRoomName()}
            </h2>
          ) : null}
          <p className="text-sm text-gray-800">
            created by {currentRoom.getCreator()}
          </p>
        </div>

        <div className="flex gap-2">
          <p className="bg-indigo-200 shadow-sm text-gray-800 border-2 py-1 px-4 rounded-full">
            public room
          </p>
          <p className="bg-indigo-200 shadow-sm text-gray-800 border-2 py-1 px-4 rounded-full">
            encrypted
          </p>
        </div>
      </div>

      <button className="w-full scale-95 hover:scale-100 capitalize font-bold border-4 py-2 rounded-md border-indigo-200 text-gray-600 border-opacity-50 bg-transparent mx-4 shadow-sm duration-300 hover:border-indigo-300 hover:text-gray-800">
        invite
      </button>

      <input
        type="text"
        className="border-4 mx-4 w-[80%]"
        value={query}
        onChange={(e) => setQuery(e.target.value.toLowerCase())}
      />

      <div className="w-full overflow-y-scroll scrollbar">
        <ul className="min-w-0 flex flex-col gap-2 mx-4">
          {admins.length > 0 ? (
            <p className="font-bold capitalize text-gray-600">
              admins ({admins.length})
            </p>
          ) : null}
          {admins.length > 0
            ? admins.map((m) => (
                <MemberChip
                  // presencePromise={client.getPresence(m.userId)}
                  presenceEvent={presences[m.userId]}
                  key={m.name}
                  member={m}
                />
              ))
            : null}
          <p className="font-bold capitalize text-gray-600">
            members ({regulars.length})
          </p>
          {regulars.slice(0,50).map((m) => (
            <MemberChip
              // presencePromise={}
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
  presenceEvent, // presencePromise,
}: {
  member: RoomMember;
  presenceEvent?: IContent;
  // presencePromise: Promise<IStatusResponse>;
}) => {
  const [open, setOpen] = useState(false);
  const [presence, setPresence] = useState<IStatusResponse | null>(
    (presenceEvent as IStatusResponse) ?? null,
  );

  // cache this per User
  // useEffect(() => {
  //   presencePromise
  //     .then((resp) => {
  //       setPresence(resp);
  //     })
  //     .catch(() => setPresence(null));
  // }, []);

  return (
    <>
      <MemberInfo
        presence={presence ?? undefined}
        visible={open}
        setVisible={setOpen}
        member={member}
      />
      <button
        onClick={() => setOpen(true)}
        className={`w-full hover:bg-indigo-200 duration-300 flex gap-4 items-center min-w-0 border-b-4 p-4 rounded-md shadow-md`}
      >
        <Avatar
          id={member.userId}
          type="user"
          size={16}
          className={`shadow-sm ${
            presence?.presence === "online"
              ? "border-green-200"
              : presence?.presence === "unavailable"
              ? "border-red-300"
              : "border-gray-300"
          }`}
        />
        <div className="text-start min-w-0">
          <p className="truncate max-w-full font-bold">{member.name}</p>
          {presence?.status_msg ? (
            <p className="text-sm truncate max-w-full">{presence.status_msg}</p>
          ) : null}
        </div>
      </button>
    </>
  );
};

const MemberInfo = ({
  member,
  presence,
  visible,
  setVisible,
}: {
  member: RoomMember;
  presence?: IStatusResponse;
  visible: boolean;
  setVisible: (_: boolean) => void;
}) => {
  return (
    <Modal
      title=""
      key={member.name}
      visible={visible}
      setVisible={setVisible}
      className="w-[30%]"
    >
      <div className="flex flex-col flex-wrap justify-center content-center gap-4 m-4 pb-[30px]">
        <Avatar
          id={member.userId}
          type="user"
          size={32}
          className={`shadow-md self-center`}
        />
        <div className="text-center">
          <h1 className="text-2xl">{member.rawDisplayName}</h1>
          <button
            onClick={() => {
              /* start DM */
            }}
            className="bg-gray-200 shadow-sm text-gray-800 py-1 m-2 px-4 rounded-full"
          >
            {member.userId}
          </button>
          {presence?.last_active_ago ? (
            <p>
              last seen{" "}
              {moment(+new Date() - presence.last_active_ago).fromNow()}
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export default MemberList;
