import { ClientEvent, MatrixEvent, Room } from "matrix-js-sdk";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { ClientContext } from "./client";

export const RoomContext = createContext<RoomState | null>(null);

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  roomEvents: Map<string, MatrixEvent[]>;
  setRooms: (_: Room[]) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (_: Map<string, MatrixEvent[]>) => void;
}

const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomEvents, setRoomEvents] = useState<Map<string, MatrixEvent[]>>(
    new Map(),
  );
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  const roomState: RoomState = {
    rooms,
    currentRoom,
    roomEvents,
    setRooms,
    setCurrentRoom,
    setRoomEvents,
  };

  useEffect(() => {
    setRooms(client.getRooms());
    rooms.map((r) =>
      client
        .scrollback(r, Number.MAX_SAFE_INTEGER)
        .then((scrollback) =>
          setRoomEvents({
            ...roomEvents,
            [r.roomId]: scrollback.getLiveTimeline().getEvents(),
          }),
        ),
    );
  }, []);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()));

  return (
    <RoomContext.Provider value={roomState}>
      {props.children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;
