import {
  ClientEvent,
  Direction,
  MatrixEvent,
  Room,
  RoomEvent,
  RoomState,
} from "matrix-js-sdk";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ClientContext } from "./client";

export const RoomContext = createContext<
  MyRoomState | null
>(null);

interface MyRoomState {
  rooms: Room[];
  roomStates: Record<string, RoomState>;
  currentRoom: Room | null;
  roomEvents: Record<string, MatrixEvent[]>;
  setRooms: (_: Room[]) => void;
  setRoomStates: (_: Record<string, RoomState>) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (_: Record<string, MatrixEvent[]>) => void;
  avatars: Record<string, string>;
  setAvatars: (_: Record<string, string>) => void;
}
const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<(Room | null)[]>([]);
  const [roomEvents, setRoomEvents] = useState<Record<string, MatrixEvent[]>>(
    {},
  );
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  const roomState: MyRoomState = useMemo(() => {
    return {
      rooms: rooms.filter(r => !r) as Room[],
      roomStates,
      currentRoom,
      roomEvents,
      setRooms,
      setRoomStates,
      setCurrentRoom,
      setRoomEvents,
      avatars,
      setAvatars,
    };
  }, [currentRoom, roomEvents, rooms, roomStates]);

  useEffect(() => {
    setRooms(client.getRooms());

    // retrieve the actual room length and attempt to fill it with at least joined rooms
    client
      .getJoinedRooms()
      .then((resp) =>
        setRooms((prev) => [
          ...prev,
          ...Array(resp.joined_rooms.length - prev.length).fill(null),
        ]),
      );
  }, []);

  useEffect(() => {
    if (rooms.some((r) => !r)) {
      return;
    }

    setRoomEvents(
      rooms.reduce(
        (init, r) => ({
          ...init,
          [r!.roomId]: r!.getLiveTimeline().getEvents(),
        }),
        {},
      ),
    );
    setRoomStates(
      rooms.reduce(
        (init, r) => ({
          ...init,
          [r!.roomId]: r!.getLiveTimeline().getState(Direction.Backward),
        }),
        {},
      ),
    );
  }, [rooms.length]);

  client.on(ClientEvent.Room, (newRoom) =>
    setRooms((prev) => [...prev, newRoom]),
  );

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    if (room) {
      if (startOfTimeline) {
        return;
      }

      setRoomEvents({
        ...roomEvents,
        [room.roomId]: [...(roomEvents[room.roomId] ?? []), event],
      });
    }
  });

  return (
    <RoomContext.Provider
    value={roomState}
    >
      {props.children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;
