import {
  IPublicRoomsChunkRoom,
  Room,
} from "matrix-js-sdk";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
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

const roomToAvatarUrl = (room: Room, userId: string) =>
  room.getMembers().length <= 2
    ? room
        .getMembers()
        .find((member) => member.userId !== userId)
        ?.getAvatarUrl("https://matrix.org", 120, 120, "scale", true, true)
    : room.getAvatarUrl("https://matrix.org", 120, 120, "scale", true);

const RoomIconWidget = ({
  room,
}: {
  room: Room;
}) => {
  const client = useContext(ClientContext);
  const { setCurrentRoom } = useContext(RoomContext)!;

  return (
    <button onClick={() => setCurrentRoom(room)}>
      <img
        className="h-[50px] w-[50px] rounded-full border-slate-400"
        src={roomToAvatarUrl(room, client.getUserId()!)!}
        title={room.name}
      />
    </button>
  );
};

const RoomWidget = ({
  room,
}: {
  room: Room;
}) => {
  const client = useContext(ClientContext);
  const { setCurrentRoom } = useContext(RoomContext)!;

  const events = room.getLiveTimeline().getEvents();
  const latestEvent = events[events.length - 1];
  const latestMessage = latestEvent?.getContent().body ? (room.getMembers().length <= 2 ? (
    latestEvent?.getContent().body
  ) : (
    latestEvent?.getSender() + ": " + latestEvent.getContent().body
  )) : null;

  return (
    <button
      onClick={() => setCurrentRoom(room)}
      className="flex items-center shrink gap-2 p-4 w-full border-2 rounded-md hover:bg-green-300"
      key={room.name}
    >
      <img
        className="h-[60px] w-[60px] rounded-full border-2 border-black"
        src={roomToAvatarUrl(room, client.getUserId()!)!}
        title={room.name}
      />
      <div className="flex flex-col items-start bg-green-200 min-w-0">
        <p className="max-w-full truncate">{room.name}</p>
        <p className="max-w-full truncate">{latestMessage}</p>
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
            <RoomIconWidget room={room} />
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
        <input
          className="basis-full mx-4 max-h-[40px] flex-1"
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
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
        <input
          className="basis-full mx-4 max-h-[40px] flex-1"
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          autoFocus
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

const Sidebar = ({
  rooms,
}: {
  rooms: Room[];
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);
  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        setSidebarWidth(mouseMoveEvent.clientX);
        if (mouseMoveEvent.clientX < 120) {
          setSidebarWidth(60);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);
  
  return (
    <>
      <div
        className="flex flex-col shrink-0 grow-0 basis-1/2 bg-green-100 h-screen overflow-y-auto scrollbar px-2"
        onMouseDown={(e) => e.preventDefault()}
        style={{ flexBasis: sidebarWidth }}
        ref={sidebarRef}
      >
        <Togglable
          title={sidebarWidth < 120 ? "" : "people"}
          modalType="friendModal"
        >
          <RoomList
            rooms={rooms.filter((r) => r.getMembers().length <= 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable
          title={sidebarWidth < 120 ? "" : "public rooms"}
          modalType="publicRoomModal"
        >
          <RoomList
            rooms={rooms.filter((r) => r.getMembers().length > 2)}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
      </div>
      <div
        className="p-1 cursor-col-resize resize-x bg-green-50"
        onMouseDown={startResizing}
      ></div>
    </>
  );
};

export default Sidebar;
