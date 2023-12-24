import {
  ClientEvent,
  Direction,
  EventType,
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
import { Annotator } from "../components/chips/Annotation";
import { getAnnotations, getRedactions, getReplacements } from "../lib/helpers";

export const RoomContext = createContext<MyRoomState | null>(null);

type Message = {
  event: MatrixEvent;
  replacements?: MatrixEvent[];
  // no need to store the entire event for annotations
  annotations?: Record<string, Annotator[]>;
  redation?: MatrixEvent;
};

interface MyRoomState {
  rooms: Room[];
  roomStates: Record<string, RoomState>;
  currentRoom: Room | null;
  roomEvents: Record<string, Message[]>;
  setRooms: (_: Room[]) => void;
  setRoomStates: (_: Record<string, RoomState>) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (_: Record<string, Message[]>) => void;
  // avatars: Record<string, string>;
  // setAvatars: (_: Record<string, string>) => void;
}
const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);
  const roomsLength = useRef<number>();

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomEvents, setRoomEvents] = useState<Record<string, Message[]>>({});
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});

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
      // avatars,
      // setAvatars,
    };
  }, [currentRoom, roomEvents, rooms, roomStates]);

  useEffect(() => {
    // retrieve the actual room length and attempt to fill it with at least joined rooms
    client.getJoinedRooms().then((resp) => {
      roomsLength.current = resp.joined_rooms.length;
    });
  }, []);

  useEffect(() => {
    if (rooms.length === 0) {
      return;
    }

    setRoomEvents(
      rooms.reduce((init, r) => {
        const events = r.getLiveTimeline().getEvents();
        const allReplacements = getReplacements(events);
        const allAnnotations = getAnnotations(events);
        const allRedactions = getRedactions(events);

        const messages = events.filter(isRoomMessage);

        return {
          ...init,
          [r.roomId]: messages.reduce((init, event) => {
            const id = event.getId()!;
            return [
              ...init,
              {
                event,
                replacements: allReplacements[id],
                annotations: allAnnotations[id],
                redation: allRedactions[id],
              },
            ];
          }, [] as Message[]),
        };
      }, {}),
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

  if (
    !(
      roomsLength.current &&
      roomsLength.current > 0 &&
      Object.values(roomEvents).length >= roomsLength.current
    )
  ) {
    console.log(roomsLength.current, Object.values(roomEvents).length);
    return null;
  }

  return (
    <RoomContext.Provider value={roomState}>
      {props.children}
    </RoomContext.Provider>
  );
};

const sortByTimestamp = (events: MatrixEvent[]) =>
  events
    .reduce((init, event, i) => {
      if (i === 0) {
        return [[event]];
      }

      // we retrieve the last
      const previousList = init.slice(-1)[0];
      const previousEvent = previousList?.slice(-1)[0];

      if (!previousList || !previousEvent) {
        throw new Error("this shouldn't be possible");
      }

      const diff = event.getTs() - previousEvent.getTs();
      const isSameSender = previousEvent.getSender() === event.getSender();

      return isSameSender &&
        !isDifferentDay(previousEvent, event) &&
        isRoomMessage(event) &&
        isRoomMessage(previousEvent) &&
        diff < 60 * 1000
        ? [...init.slice(0, init.length - 1), [event, ...previousList]]
        : [...init, [event]];
    }, [] as MatrixEvent[][])
    .map((list) => list.map((e) => e.getId()!));

export const isRoomMessage = (event: MatrixEvent) =>
  event.getType() === EventType.RoomMessage ||
  event.getType() === EventType.RoomMessageEncrypted;

const isDifferentDay = (previous: MatrixEvent, current: MatrixEvent) => {
  const previousDate = new Date(previous.getTs());
  const date = new Date(current.getTs());

  return date.getDate() !== previousDate.getDate();
};

export default RoomProvider;
