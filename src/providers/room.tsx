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
  useRef,
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
  const roomsLength = useRef<number>();

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomEvents, setRoomEvents] = useState<Record<string, MatrixEvent[]>>(
    {},
  );
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});
  const [avatars, setAvatars] = useState<Record<string, string>>({});

  const roomState: MyRoomState = useMemo(() => {
    return {
      rooms,
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
    // retrieve the actual room length and attempt to fill it with at least joined rooms
    client
      .getJoinedRooms()
      .then((resp) => {
        roomsLength.current = resp.joined_rooms.length;
      });
  }, []);

  useEffect(() => {
    if (rooms.length === 0) {
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

  if (!(roomsLength.current && roomsLength.current > 0 && Object.values(roomEvents).length >= roomsLength.current)) {
    console.log(roomsLength.current, Object.values(roomEvents).length)
    return null;
  }

  return (
    <RoomContext.Provider
    value={roomState}
    >
      {props.children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;
