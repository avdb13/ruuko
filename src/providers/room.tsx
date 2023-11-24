import { ClientEvent, MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
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
    if (rooms.length > 0) {
      rooms.map((r) =>
        client
          .scrollback(r, Number.MAX_SAFE_INTEGER)
          .then((scrollback) =>
            setRoomEvents(
              roomEvents.set(
                r.roomId,
                scrollback.getLiveTimeline().getEvents(),
              ),
            ),
          ),
      );
    }
  }, [rooms.length]);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()));

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    // weird bug that gets triggered the message twice
    if (room) {
      const currentRoomEvents = roomEvents.get(room.roomId)!;
      if (startOfTimeline || currentRoomEvents[currentRoomEvents.length - 1] === event) {
        return;
      }

      // check behavior later
      setRoomEvents(roomEvents.set(room.roomId, [...currentRoomEvents, event]));
    }
  });

  return (
    <RoomContext.Provider value={roomState}>
      {props.children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;
