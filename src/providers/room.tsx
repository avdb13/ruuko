import { ClientEvent, EventType, MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { ClientContext } from "./client";

export const RoomContext = createContext<RoomState | null>(null);

// Map in javascript has O(n) access time but object is constant
interface RoomState {
  rooms: Room[] | null;
  currentRoom: Room | null;
  roomEvents: Record<string, Record<EventType, Record<string, MatrixEvent>>>;
  setRooms: (_: Room[]) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (
    _: Record<string, Record<string, Record<string, MatrixEvent>>>,
  ) => void;
}

const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);

  // null because otherwise we can't distinguish between no rooms and not done preparing the store
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [roomEvents, setRoomEvents] = useState<
    Record<string, Record<string, Record<string, MatrixEvent>>>
  >({});
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
    client.once(ClientEvent.Sync, (state, previousState, res) => {});

    setRooms(client.getRooms());
  }, []);

  useEffect(() => {
    if (rooms) {
      rooms.forEach((r) =>
        // allow setting limit later
        client.scrollback(r).then((scrollback) => {
          // WARNING: we're inside a map, React batches updates so we have to pass a closure to use `previousEvents` here
          setRoomEvents((previousEvents) => ({
            ...previousEvents,
            [scrollback.roomId]: scrollback
              .getLiveTimeline()
              .getEvents()
              .reduce(
                (init, event) => ({
                  ...init,
                  [event.getType()]: {
                    ...(init[event.getType()] || {}),
                    [event.getId()!]: event,
                  },
                }),
                {} as Record<string, Record<string, MatrixEvent>>,
              ),
          }));
        }),
      );
    }
  }, [rooms ? rooms.length : null]);

  useEffect(() => {
    if (rooms && client.getRooms().length === rooms.length) {
      for (const r of rooms) {
        const events = r.getLiveTimeline().getEvents();

        const sortedEvents = events.reduce(
          (init, event) => ({
            ...init,
            [event.getType()]: {
              ...(init[event.getType()] || {}),
              [event.getId()!]: event,
            },
          }),
          {} as Record<string, Record<string, MatrixEvent>>,
        );

        setRoomEvents((prev) => ({ ...prev, [r.roomId]: sortedEvents }));
      }
    }
  }, [rooms ? rooms.length : null, Object.entries(roomEvents).length]);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()));

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    // weird bug that gets triggered the message twice
    // console.log(event.getContent());

    if (room) {
      if (
        startOfTimeline
        // || currentRoomEvents[Object.values(currentRoomEvents).length - 1] === event
      ) {
        return;
      }

      // check behavior later
      setRoomEvents({
        ...roomEvents,
        [room.roomId]: {
          ...roomEvents[room.roomId],
          [event.getType()]: {
            ...(roomEvents[room.roomId] || {})[event.getType()],
            [event.getId()!]: event,
          },
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
