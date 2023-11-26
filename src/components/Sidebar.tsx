import {
  IPublicRoomsChunkRoom,
  Room,
} from "matrix-js-sdk";
import {
  useState,
  useRef,
  PropsWithChildren,
  Ref,
  useContext,
} from "react";
import Modal from "./Modal";
import { ClientContext } from "../providers/client";
import { DisplayedMember } from "./chips";
import UserChip from "./chips/User";
import RoomChip from "./chips/Room";
import { RoomContext } from "../providers/room";
import formatEvent from "../lib/eventFormatter";
import Resizable from "./Resizable";
import Scrollbar from "./Scrollbar";
import UserPanel from "./UserPanel";
import Avatar from "./Avatar";
import ModalInput from "./ModalInput";

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

const RoomIconWidget = ({
  room,
}: {
  room: Room;
}) => {
  const { setCurrentRoom } = useContext(RoomContext)!;

  return (
    <button onClick={() => setCurrentRoom(room)}>
      <Avatar id={room.roomId} type="room" size={16} />
    </button>
  );
};

const RoomWidget = ({
  room,
}: {
  room: Room;
}) => {
  const { setCurrentRoom } = useContext(RoomContext)!;

  const events = room.getLiveTimeline().getEvents();
  const latestEvent = events[events.length - 1];

  return (
    <button
      onClick={() => setCurrentRoom(room)}
      className="flex items-center shrink gap-2 p-4 w-full border-2 rounded-md hover:bg-green-300"
      key={room.name}
    >
      <Avatar id={room.roomId} type="room" size={16} />
      <div className="flex flex-col items-start bg-green-200 min-w-0">
        <p className="max-w-full truncate font-bold">{room.name}</p>
        <p className="max-w-full truncate text-sm">{latestEvent ? formatEvent(latestEvent, room.getMembers().length) : null}</p>
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

// temporary solution
type ModalType = "friendModal" | "publicRoomModal";

const FriendModal = ({ modalRef }: { modalRef: Ref<ModalProps> }) => {
  const client = useContext(ClientContext);

  const [term, setTerm] = useState("");
  const [result, setResult] = useState<DisplayedMember[] | null>(null);
  client.searchUserDirectory({ term }).then((resp) => setResult(resp.results));

  return (
    <Modal ref={modalRef} title="Direct Messages">
      <div className="flex items-center m-4 w-[80%]">
        <ModalInput
          placeholder="room"
          className="basis-full p-4 mx-4 max-h-[40px] flex-1 focus:border-2"
          type="text"
          onChange={(e) => setTerm(e.target.value)}
        />
        <button className="rounded-md bg-zinc-100 p-[10px]">🔍</button>
      </div>
      {term.length > 0 ? (
        <ul className="flex flex-col w-[80%] border-2">
          {result
            ? result.map((member) => (
                <UserChip
                  member={member}
                  closeModal={() => modalRef.current?.toggleVisibility()}
                />
              ))
            : null}
        </ul>
      ) : null}
    </Modal>
  );
};

const PublicRoomModal = ({ modalRef }: { modalRef: Ref<ModalProps> }) => {
  const client = useContext(ClientContext);

  const [term, setTerm] = useState("");
  const [result, setResult] = useState<IPublicRoomsChunkRoom[] | null>(null);

  client
    .publicRooms({
      // server: "https://matrix.org",
      limit: 50,
      filter: { generic_search_term: term },
    })
    .then((resp) => setResult(resp.chunk));

  return (
    <Modal ref={modalRef} title="Public Rooms">
      <div className="flex items-center m-4 w-[80%]">
        <ModalInput
          className="basis-full mx-4 max-h-[40px] flex-1"
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <button className="rounded-md bg-zinc-100 p-[10px]">🔍</button>
      </div>
      {term.length > 0 ? (
        <ul className="flex flex-col w-[80%] border-2">
          {result
            ? result.map((room) => (
                <RoomChip
                  room={room}
                  closeModal={() => modalRef.current?.toggleVisibility()}
                />
              ))
            : null}
        </ul>
      ) : null}
    </Modal>
  );
};

const Togglable = (
  props: PropsWithChildren<{ title: string; modalType: ModalType }>,
) => {
  const [toggled, setToggled] = useState(true);
  const degrees = toggled ? "rotate-90" : "rotate-270";
  const modalRef = useRef<ModalProps>(null);

  return (
    <div>
      {props.modalType === "friendModal" ? (
        <FriendModal modalRef={modalRef} />
      ) : (
        <PublicRoomModal modalRef={modalRef} />
      )}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <button className={degrees} onClick={() => setToggled(!toggled)}>
            {">"}
          </button>
          <p>{props.title}</p>
        </div>
        <button onClick={() => modalRef.current?.toggleVisibility()}>
          {"+"}
        </button>
      </div>
      {toggled ? <>{props.children}</> : null}
    </div>
  );
};

const Sidebar = () => {
  const { rooms } = useContext(RoomContext)!;
  const sortedRooms = rooms.sort((a, b) => sortRooms(a, b));
  const [sidebarWidth, setSidebarWidth] = useState(300);

  return (
    <Resizable width={sidebarWidth} setWidth={setSidebarWidth}>
      <Scrollbar>
        <Togglable
          title={sidebarWidth < 120 ? "" : "people"}
          modalType="friendModal"
        >
          <RoomList
            rooms={sortedRooms.filter((r) => r.getMembers().length <= 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable
          title={sidebarWidth < 120 ? "" : "public rooms"}
          modalType="publicRoomModal"
        >
          <RoomList
            rooms={sortedRooms.filter((r) => r.getMembers().length > 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable
          title={sidebarWidth < 120 ? "" : "people"}
          modalType="friendModal"
        >
          <RoomList
            rooms={sortedRooms.filter((r) => r.getMembers().length <= 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable
          title={sidebarWidth < 120 ? "" : "public rooms"}
          modalType="publicRoomModal"
        >
          <RoomList
            rooms={sortedRooms.filter((r) => r.getMembers().length > 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
      </Scrollbar>
      <UserPanel />
    </Resizable>
  );
};

export default Sidebar;
