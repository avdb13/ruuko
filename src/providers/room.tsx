import { ClientEvent, MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { ClientContext } from "./client";
import { isAnnotation } from "../lib/eventFormatter";
import { addAnnotation } from "../lib/helpers";

export const RoomContext = createContext<RoomState | null>(null);

// Map in javascript has O(n) access time but object is constant
interface RoomState {
  rooms: Room[] | null;
  currentRoom: Room | null;
  roomEvents: Record<string, Record<string, MatrixEvent>>;
  annotations: Record<string, Record<string, Record<string, string[]>>>;
  setRooms: (_: Room[]) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (_: Record<string, Record<string, MatrixEvent>>) => void;
  setAnnotations: (_: Record<string, Record<string, Record<string, string[]>>>) => void;
}

const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);

  // null because otherwise we can't distinguish between no rooms and not done preparing the store
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [roomEvents, setRoomEvents] = useState<
    Record<string, Record<string, MatrixEvent>>
  >({});
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [annotations, setAnnotations] = useState<
    Record<string, Record<string, Record<string, string[]>>>
  >({});

  const roomState: RoomState = {
    rooms,
    currentRoom,
    roomEvents,
    annotations,
    setRooms,
    setCurrentRoom,
    setRoomEvents,
    setAnnotations,
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
                (init, e) => ({ ...init, [e.getId()!]: e }),
                {} as Record<string, MatrixEvent>,
              ),
          }));
        }),
      );
    }
  }, [rooms ? rooms.length : null]);

  useEffect(() => {
    if (rooms && client.getRooms().length === rooms.length) {
      for (const events of Object.values(roomEvents)) {
        for (const event of Object.values(events)) {
          if (isAnnotation(event)) {
            setAnnotations((previousAnnotations) =>
              addAnnotation(previousAnnotations, event),
            );
          }
        }
      }

      // const roomEventsWithoutAnnotations = Object.entries(roomEvents).reduce(
      //   (obj, [roomId, events]) => ({
      //     ...obj,
      //     [roomId]: Object.values(events)
      //       .filter((e) => !isAnnotation(e))
      //       .reduce(
      //         (init, e) => (e.getId() ? { ...init, [e.getId()!]: e } : init),
      //         {} as Record<string, MatrixEvent>,
      //       ),
      //   }),
      //   {} as Record<string, Record<string, MatrixEvent>>,
      // );

      setRoomEvents(roomEvents);
    }
  }, [rooms ? rooms.length : null, Object.entries(roomEvents).length]);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()));

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    // weird bug that gets triggered the message twice
    // console.log(event.getContent());

    if (room) {
      const currentRoomEvents = roomEvents[room.roomId];

      if (!currentRoomEvents) {
        return;
      }

      if (
        startOfTimeline ||
        currentRoomEvents[Object.values(currentRoomEvents).length - 1] === event
      ) {
        return;
      }

      if (isAnnotation(event)) {
        setAnnotations(addAnnotation(annotations, event));
      } else {
        // check behavior later
        setRoomEvents({
          ...roomEvents,
          [room.roomId]: { ...currentRoomEvents, [event.getId()!]: event },
        });
      }
    }
  });

  return (
    <RoomContext.Provider value={roomState}>
      {props.children}
    </RoomContext.Provider>
  );
};

export default RoomProvider;
