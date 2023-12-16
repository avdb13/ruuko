import { ClientEvent, Direction, MatrixEvent, Room, RoomEvent, RoomState } from "matrix-js-sdk";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { ClientContext } from "./client";

export const RoomContext = createContext<MyRoomState | null>(null);

interface MyRoomState {
  rooms: Room[] | null;
  roomStates: Record<string, RoomState>;
  currentRoom: Room | null;
  roomEvents: Record<string, MatrixEvent[]>;
  setRooms: (_: Room[]) => void;
  setRoomStates: (_: Record<string, RoomState>) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (_: Record<string, MatrixEvent[]>) => void;
}

const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [roomEvents, setRoomEvents] = useState<
    Record<string, MatrixEvent[]>
  >({});
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});

  const roomState: MyRoomState = {
    rooms,
    roomStates,
    currentRoom,
    roomEvents,
    setRooms,
    setRoomStates,
    setCurrentRoom,
    setRoomEvents,
  };

  useEffect(() => {
    setRooms(client.getRooms());
  }, []);

  useEffect(() => {
    if (!rooms || client.getRooms().length !== rooms.length) {
      return;
    }

    for (const r of rooms) {
        setRoomEvents((previous) => ({
          ...previous,
          [r.roomId]: r
            .getLiveTimeline()
            .getEvents()
        }));

      setRoomStates(previous => {
        const state = r.getLiveTimeline().getState(Direction.Backward);
        return state ?
          ({...previous, [r.roomId]: state }) : previous;
      });
    }
  }, [rooms?.length]);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()));

  // how do we update the roomStates ?
  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    if (room) {
      if (
        startOfTimeline
      ) {
        return;
      }

      setRoomEvents({
        ...roomEvents,
        [room.roomId]: [...roomEvents[room.roomId] ?? [], event],
      });
    }
  });

  return (
    <RoomContext.Provider value={roomState}>
      {props.children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;
