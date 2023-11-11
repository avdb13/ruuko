import { MatrixClient, Room, RoomMember } from "matrix-js-sdk";
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

const roomToAvatarUrl = (room: Room) =>
  room.getAvatarUrl("https://matrix.org", 120, 120, "scale", true);

const RoomIconWidget = ({
  room,
  setCurrentRoom,
}: {
  room: Room;
  setCurrentRoom: (_: Room) => void;
}) => (
  <button onClick={() => setCurrentRoom(room)}>
    <img
      className="h-[50px] w-[50px] rounded-full border-slate-400"
      src={roomToAvatarUrl(room)!}
      title={room.name}
    />
  </button>
);


const RoomWidget = ({
  room,
  setCurrentRoom,
}: {
  room: Room;
  setCurrentRoom: (_: Room) => void;
}) => {
  const events = room.getLiveTimeline().getEvents();
  const latestEvent = events[events.length - 1];
  console.log(room.name, latestEvent?.getContent());

  return (
    <button
      onClick={() => setCurrentRoom(room)}
      className="flex items-center shrink gap-2 p-4 w-full border-2 rounded-md hover:bg-green-300"
      key={room.name}
    >
      <img
        className="h-[60px] w-[60px] rounded-full border-2 border-black"
        src={roomToAvatarUrl(room)!}
        title={room.name}
      />
      <div className="flex flex-col items-start bg-green-200 min-w-0">
        <p className="truncate">{room.name}</p>
        {latestEvent?.getContent().body ? (
          <p className="truncate max-w-full">
            {latestEvent.getSender() + ": " + latestEvent.getContent().body}
          </p>
        ) : (
          // maybe something else in the future?
          null
        )}
      </div>
    </button>
  );
};

const RoomList = ({
  sidebarWidth,
  rooms,
  setCurrentRoom,
}: {
  sidebarWidth: number;
  rooms: Room[];
  setCurrentRoom: (_: Room) => void;
}) => {
  return (
    <>
      {sidebarWidth < 120 ? (
        <div className="flex flex-col gap-[10px] items-center">
          {rooms.map((room) => (
            <RoomIconWidget room={room} setCurrentRoom={setCurrentRoom} />
          ))}
        </div>
      ) : (
        <div>
          {rooms.map((room) => (
            <RoomWidget room={room} setCurrentRoom={setCurrentRoom} />
          ))}
        </div>
      )}
    </>
  );
};

interface DisplayedMember {
  user_id: string;
  avatar_url?: string;
  display_name?: string;
}

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
          {result ? (
            result.map((member) => <UserChip member={member} closeModal={() => modalRef.current?.toggleVisibility()} />)
          ) : (
            null
          )}
        </ul>
      ) : null}
    </Modal>
  );
};

// make this only trigger if no image can be loaded for the user's homeserver
const fallbackMxcUrlToHttp = (client: MatrixClient, url?: string) => {
  const originalUrl = url ? client.mxcUrlToHttp(url, 80, 80, "scale", true) || "" : "";
  return originalUrl.replace("matrix.envs.net", "matrix.org");
}

const UserChip = ({ member, closeModal } : { member: DisplayedMember, closeModal: () => void }) => {
  const client = useContext(ClientContext);
  const src = fallbackMxcUrlToHttp(client, member.avatar_url);

  const createRoom = () => {
    closeModal();
    client.createRoom({ is_direct: true, invite: [member.user_id] });
  }

  return (
    <button className="flex border-2 p-2 items-center" key={member.user_id} onClick={createRoom}>
      <img src={src} alt={member.user_id} className="rounded-full w-8 h-8" />
      <p className="px-1">{member.display_name}</p>
      <p className="text-zinc-500">{member.user_id}</p>
    </button>
  )
}

const Togglable = (props: PropsWithChildren<{ title: string }>) => {
  const [toggled, setToggled] = useState(true);
  const degrees = toggled ? "rotate-90" : "rotate-270";
  const friendModalRef = useRef<ModalProps>(null);

  return (
    <div>
      <FriendModal modalRef={friendModalRef} />
      <div className="flex justify-between">
        <div className="flex gap-2">
          <button className={degrees} onClick={() => setToggled(!toggled)}>
            {">"}
          </button>
          <p>{props.title}</p>
        </div>
        <button onClick={() => friendModalRef.current?.toggleVisibility()}>
          {"+"}
        </button>
      </div>
      {toggled ? <>{props.children}</> : null}
    </div>
  );
};

const Sidebar = ({
  rooms,
  setCurrentRoom,
}: {
  rooms: Room[];
  setCurrentRoom: (_: Room) => void;
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
        className="flex flex-col shrink-0 grow-0 basis-1/2 bg-green-100 h-screen overflow-hidden"
        onMouseDown={(e) => e.preventDefault()}
        style={{ flexBasis: sidebarWidth }}
        ref={sidebarRef}
      >
        <Togglable title={sidebarWidth < 120 ? "" : "people"}>
          <RoomList
            rooms={rooms.filter((r) => r.getMembers().length <= 2)}
            setCurrentRoom={setCurrentRoom}
            sidebarWidth={sidebarWidth}
          />
        </Togglable>
        <Togglable title={sidebarWidth < 120 ? "" : "public rooms"}>
          <RoomList
            rooms={rooms.filter((r) => r.getMembers().length > 2)}
            setCurrentRoom={setCurrentRoom}
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
