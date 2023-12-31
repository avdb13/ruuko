import {
  ClientEvent,
  Direction,
  EventType,
  MatrixEvent,
  NotificationCountType,
  RelationType,
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
import {
  addNewEvent,
  getAnnotations,
  getRedactions,
  getReplacements,
} from "../lib/helpers";

export const RoomContext = createContext<MyRoomState | null>(null);

type Metadata = {
  replacements?: MatrixEvent[];
  // no need to store the entire event for annotations
  annotations?: Record<string, Annotator[]>;
  redaction?: MatrixEvent;
};

export interface Message extends Metadata {
  event: MatrixEvent;
}

interface MyRoomState {
  rooms: Room[];
  roomStates: Record<string, RoomState>;
  currentRoom: Room | null;
  roomEvents: Record<string, Message[]>;
  scrolling: boolean;
  setRooms: (_: Room[]) => void;
  setRoomStates: (_: Record<string, RoomState>) => void;
  setCurrentRoom: (_: Room) => void;
  setRoomEvents: (_: Record<string, Message[]>) => void;
  setScrolling: (_: boolean) => void;
}
const RoomProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);
  const roomsLength = useRef<number>();

  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomEvents, setRoomEvents] = useState<Record<string, Message[]>>({});
  const [roomStates, setRoomStates] = useState<Record<string, RoomState>>({});
  const [scrolling, setScrolling] =useState(false);

  const roomState: MyRoomState = useMemo(() => {
    return {
      rooms,
      roomStates,
      currentRoom,
      roomEvents,
      scrolling,
      setRooms,
      setRoomStates,
      setCurrentRoom,
      setRoomEvents,
      setScrolling,
    };
  }, [currentRoom, roomEvents, rooms, roomStates]);


  useEffect(() => {
    if (currentRoom) {
      currentRoom.setUnreadNotificationCount(NotificationCountType.Total, 0);
    }
  }, [currentRoom])
  useEffect(() => {
    // retrieve the actual room length and attempt to fill it with at least joined rooms
    console.log("getting joined rooms");
    client.getJoinedRooms().then((resp) => {
      roomsLength.current = resp.joined_rooms.length;

      const res = client.getRooms();
      console.log(res);
     setRooms(res);
    });
  }, []);

  useEffect(() => {
    if (rooms.length === 0) {
      console.log("no rooms available");
      return;
    }

    // not sure if correct
    console.log("rooms available: " + rooms.length + " " + rooms.map(r => r.name).join(", "));
    setRoomEvents(
      rooms.reduce((init, r) => {
        const allEvents = r.getLiveTimeline().getEvents();
        const firstMessageIdx = allEvents.findIndex(e => isRoomMessage(e));
        const events = allEvents.slice(firstMessageIdx);

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
                redaction: allRedactions[id],
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
  }, [rooms, scrolling]);

  client.on(ClientEvent.Room, (newRoom) =>
    // weird bug where the same rooms appear multiple times
    setRooms((prev) => [...new Set(prev.concat(newRoom))])
  );

  client.on(RoomEvent.Timeline, (e, room, startOfTimeline) => {
    if (room) {
      if (startOfTimeline) {
        return;
      }

      setRoomEvents({
        ...roomEvents,
        [room.roomId]: addNewEvent(e, roomEvents[room.roomId]),
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
    console.log("rooms not ready");
    return null;
  }

  return (
    <RoomContext.Provider value={roomState}>
      {props.children}
    </RoomContext.Provider>
  );
};

export const sortByTimestamp = (messages: Message[]) =>
  messages
    .reduce((init, message, i) => {
      if (i === 0) {
        return [[message]];
      }

      // we retrieve the last
      const previousList = init.slice(-1)[0];
      const previousMessage = previousList?.slice(-1)[0];

      if (!previousList || !previousMessage) {
        throw new Error("this shouldn't be possible");
      }

      const event = message.event;
      const previousEvent = previousMessage.event;

      const diff = event.getTs() - previousEvent.getTs();
      const isSameSender = previousEvent.getSender() === event.getSender();

      return isSameSender &&
        !isDifferentDay(previousEvent, event) &&
        isRoomMessage(event) &&
        isRoomMessage(previousEvent) &&
        diff < 60 * 1000
        ? [...init.slice(0, init.length - 1), [message, ...previousList]]
        : [...init, [message]];
    }, [] as Message[][])
    .map((list) => list.map((m) => m.event.getId()!));

// temporary workaround
export const isRoomMessage = (event: MatrixEvent) =>
  event.getType() === EventType.RoomMessage;
  // event.getType() === EventType.RoomMessageEncrypted;

export const isDisplayable = (event: MatrixEvent) => isRoomMessage(event) || event.getType() === EventType.RoomMember

const isDifferentDay = (previous: MatrixEvent, current: MatrixEvent) => {
  const previousDate = new Date(previous.getTs());
  const date = new Date(current.getTs());

  return date.getDate() !== previousDate.getDate();
};

export default RoomProvider;
