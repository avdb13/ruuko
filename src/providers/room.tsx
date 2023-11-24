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

export const RoomContext = createContext<RoomState | null>(null);

// Map in javascript has O(n) access time but object is constant
interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  roomEvents: Record<string, MatrixEvent[]>;
  annotations: Record<string, Record<string, MatrixEvent[]>>;
  setRooms: (_: Room[]) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (_: Record<string, MatrixEvent[]>) => void;
  setAnnotations: (_: Record<string, Record<string, MatrixEvent[]>>) => void;
}

const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomEvents, setRoomEvents] = useState<Record<string, MatrixEvent[]>>(
    {},
  );
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [annotations, setAnnotations] = useState<
    Record<string, Record<string, MatrixEvent[]>>
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
    setRooms(client.getRooms());
  }, []);

  useEffect(() => {}, []);

  useEffect(() => {
    if (rooms.length > 0) {
      rooms.forEach((r) =>
        client.scrollback(r, Number.MAX_SAFE_INTEGER).then((scrollback) => {
          console.log(
            roomEvents,
            scrollback.getLiveTimeline().getEvents().length,
          );

          // WARNING: we're inside a map, React batches updates so we have to pass a closure to use `previousEvents` here
          setRoomEvents((previousEvents) => ({
            ...previousEvents,
            [r.roomId]: [...scrollback.getLiveTimeline().getEvents()],
          }));
        }),
      );
    }

    if (client.getRooms().length === rooms.length) {
      Object.entries(roomEvents).forEach(([roomId, events]) => {
        events.filter(isAnnotation).forEach((annotation) => {
          const roomAnnotations = annotations[roomId];
          const key = annotation.getContent()["m.relates_to"]?.event_id;

          if (key) {
            const newAnnotations = {
              ...roomAnnotations,
              [key]: roomAnnotations
                ? [...(roomAnnotations[key] || []), annotation]
                : [annotation],
            };

            setAnnotations((previousAnnotations) => ({
              ...previousAnnotations,
              [roomId]: newAnnotations,
            }));
          }
        });
      });

      const roomEventsWithoutAnnotations = Object.entries(roomEvents).reduce(
        (obj, [roomId, events]) => ({
          ...obj,
          [roomId]: events.filter((e) => !isAnnotation(e)),
        }),
        {} as Record<string, MatrixEvent[]>,
      );

      setRoomEvents(roomEventsWithoutAnnotations);
    }
  }, [rooms.length]);

  client.on(ClientEvent.Room, () => setRooms(client.getRooms()));

  client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
    // weird bug that gets triggered the message twice
    if (room) {
      const currentRoomEvents = roomEvents[room.roomId]!;
      if (
        startOfTimeline ||
        currentRoomEvents[currentRoomEvents.length - 1] === event
      ) {
        return;
      }

      // check behavior later
      setRoomEvents({
        ...roomEvents,
        [room.roomId]: [...currentRoomEvents, event],
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
