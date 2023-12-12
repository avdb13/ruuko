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

// Map in javascript has O(n) access time but object is constant
interface MyRoomState {
  rooms: Room[] | null;
  roomStates: Record<string, RoomState>;
  currentRoom: Room | null;
  roomEvents: Record<string, Record<string, MatrixEvent>>;
  setRooms: (_: Room[]) => void;
  setRoomStates: (_: Record<string, RoomState>) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (_: Record<string, Record<string, MatrixEvent>>) => void;
  // fallbackImage: Blob;
}

const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);
  client.once(ClientEvent.Sync, (state, previousState, res) => {

  });

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  // null because otherwise we can't distinguish between no rooms and not done preparing the store
  const [rooms, setRooms] = useState<Room[] | null>(null);

  const [roomEvents, setRoomEvents] = useState<
    Record<string, Record<string, MatrixEvent>>
  >({});
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});
  // const [fallbackImage, setFallbackImage] = useState<Blob>(new Blob());

  // useEffect(() => {
  //   fetch("/img-error.png").then(resp => resp.blob().then(blob => setFallbackImage(blob)));
  // }, [])

  const roomState: MyRoomState = {
    rooms,
    roomStates,
    currentRoom,
    roomEvents,
    setRooms,
    setRoomStates,
    setCurrentRoom,
    setRoomEvents,
    // fallbackImage,
  };

  useEffect(() => {
    setRooms(client.getRooms());
  }, []);

  useEffect(() => {
    if (!rooms || client.getRooms().length !== rooms.length) {
      return;
    }

    for (const r of rooms) {
      // allow setting limit later
      // TODO: lazy loading old messages
      client.scrollback(r, Number.MAX_SAFE_INTEGER).then((scrollback) => {
        // WARNING: we're inside a map, React batches updates so we have to pass a closure to use `previousEvents` here
        setRoomEvents((previousEvents) => ({
          ...previousEvents,
          [scrollback.roomId]: scrollback
            .getLiveTimeline()
            .getEvents()
            .reduce(
              (init, event) => ({
                ...init,
                [event.getId()!]: event,
              }),
              {} as Record<string, MatrixEvent>,
            ),
        }));
      });

      setRoomStates(previous => {
        const state = r.getLiveTimeline().getState(Direction.Backward);
        return state ?
          ({...previous, [r.roomId]: state }) : previous;
      });
    }
  }, [rooms ? rooms.length : null]);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()));

  // how do we update the roomStates ?
  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    // weird bug that gets triggered the message twice
    // console.log("received: ", event.getContent());

    if (room) {
      if (
        startOfTimeline
        // || currentRoomEvents[Object.values(currentRoomEvents).length - 1] === event
      ) {
        return;
      }

      // if (event.getType() === EventType.RoomMessage) {
      //   const relation = event.getRelation();
      //   if (relation?.rel_type === RelationType.Replace ?? null) {
      //     const oldId = relation?.event_id!;

      //     setRoomEvents({
      //       ...roomEvents,
      //       [room.roomId]: {
      //         ...roomEvents[room.roomId],
      //           [oldId]: event,
      //         },
      //     });
      //     return;
      //   }
      // }

      // check behavior later
      setRoomEvents({
        ...roomEvents,
        [room.roomId]: {
          ...roomEvents[room.roomId],
            [event.getId()!]: event,
          },
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
