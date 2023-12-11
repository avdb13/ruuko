import {
  Direction,
  EventType,
  IStatusResponse,
  MatrixEvent,
  RelationType,
  RoomState,
} from "matrix-js-sdk";
import Message, { DateMessage, MessageFrame, StateFrame } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RoomContext } from "../providers/room";
import MembersIcon from "./icons/Members";
import MemberList from "./MemberList";
import { getAnnotations, getRedactions, getReplacements } from "../lib/helpers";
import RoomInfo from "./modals/RoomInfo";
import Modal from "./Modal";

// in case we have performance issues later
// type SortingMetadata = {
//   sender: string, timestamp: number, id: string,
// }

const sortByTimestamp = (events: MatrixEvent[]) =>
  // .map(e => ({sender: e.getSender(), timestamp: e.getTs(), id: e.getId()! }))
  events
    .reduce((init, event, i) => {
      if (i === 0) {
        return [[event]];
      }

      // we retrieve the last
      const previousList = init.slice(-1)[0]!;
      const previousEvent = previousList.slice(-1)[0]!;

      const diff = event.getTs() - previousEvent.getTs();

      return previousEvent.getSender() === event.getSender() &&
        !isDifferentDay(previousEvent, event) &&
        event.getType() === EventType.RoomMessage &&
        previousEvent.getType() === EventType.RoomMessage &&
        diff < 60 * 1000
        ? [...init.slice(0, init.length - 1), [...previousList, event]]
        : [...init, [event]];
    }, [] as MatrixEvent[][])
    .map((list) => list.map((e) => e.getId()!));

const MessageWindow = () => {
  // no idea why roomEvents doesn't contain replies.
  const { currentRoom, roomEvents, roomStates } = useContext(RoomContext)!;

  const bottomDivRef = useRef<HTMLDivElement>(null);
  const [presences, setPresences] = useState<
    Record<string, IStatusResponse | null>
  >({});
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (currentRoom) {
      currentRoom.loadMembersIfNeeded().then((ok) => {
        if (currentRoom.membersLoaded() && ok) {
          const users = currentRoom.getMembers().map((m) => m.userId);

          // for (let user of users) {
          //   console.log("presence", Object.values(presences).length);
          //   client
          //     .getPresence(user)
          //     .then((resp) => setPresences({ ...presences, [user]: resp }))
          //     .catch(() => setPresences({ ...presences, [user]: null }));
          // }
        }
      });
    }
  }, []);

  // needed?
  const eventsMemo = useMemo(() => {
    // default value not good
    const arr = Object.values(roomEvents[currentRoom!.roomId] || {});
    // show first 50 events for now
    // Array.slice copies the array, might be a bad idea
    return arr.length < 50 ? arr : arr.slice(arr.length - 50);
  }, [currentRoom, roomEvents]);

  useEffect(() => {
    console.log("scroll to bottom " + currentRoom?.name);
    if (eventsMemo) {
      if (bottomDivRef.current) {
        const scroll =
          bottomDivRef.current.scrollHeight - bottomDivRef.current.clientHeight;
        bottomDivRef.current.scrollTo(0, scroll);
      }
    }
  }, [eventsMemo]);

  if (!eventsMemo || !currentRoom) {
    return <div></div>;
  }

  return (
    <div className="min-w-0 flex flex-col basis-1/2 justify-between max-h-screen grow">
      <TitleBar
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        roomState={roomStates[currentRoom.roomId] || null}
        roomName={currentRoom.name}
      />
      <div
        ref={bottomDivRef}
        className="overflow-y-auto scrollbar flex flex-col justify-end grow"
        id="bottom-div"
      >
        <Timeline events={eventsMemo} />
      </div>
      <InputBar roomId={currentRoom.roomId} />
    </div>
  );
};

const Timeline = ({ events }: { events: MatrixEvent[] }) => {
  const { currentRoom } = useContext(RoomContext)!;

  // what if we have a replaced reaction???
  const filteredEvents = events.reduce(
    (init, e) => {
      switch (e.getType()) {
        case EventType.Reaction:
          return {
            ...init,
            [EventType.Reaction]: [...init[EventType.Reaction]!, e],
          };
        case EventType.RoomRedaction:
          return {
            ...init,
            [EventType.RoomRedaction]: [...init[EventType.RoomRedaction]!, e],
          };
        default:
          switch (e.getRelation()?.rel_type) {
            case RelationType.Replace:
              return {
                ...init,
                [RelationType.Replace]: [...init[RelationType.Replace]!, e],
              };
            case RelationType.Thread:
              return {
                ...init,
                [RelationType.Thread]: [...init[RelationType.Thread]!, e],
              };
            default:
              return { ...init, ["rest"]: [...init["rest"]!, e] };
          }
      }
    },
    {
      [EventType.Reaction]: [],
      [EventType.RoomRedaction]: [],
      [RelationType.Replace]: [],
      [RelationType.Thread]: [],
      ["rest"]: [],
    } as Record<string, MatrixEvent[]>,
  );

  const allAnnotations = getAnnotations(filteredEvents[EventType.Reaction]!);
  const allReplacements = getReplacements(
    filteredEvents[RelationType.Replace]!,
  );
  const allRedactions = getRedactions(filteredEvents[EventType.RoomRedaction]!);

  const sortedEvents = sortByTimestamp(filteredEvents["rest"]!);

  // return reply + event + annotations
  const eventRecord = filteredEvents["rest"]!.reduce(
    (init, event) => ({
      ...init,
      [event.getId()!]: (
        <Message
          event={event}
          annotations={allAnnotations[event.getId()!]}
          replacements={allReplacements[event.getId()!]}
          redaction={allRedactions[event.getId()!]}
        />
      ),
    }),
    {} as Record<string, JSX.Element>,
  );

  return sortedEvents.map((list, i) => {
    const firstEvent = currentRoom?.findEventById(list[0]!)!;

    const displayName = firstEvent.getContent().displayname;

    const previous =
      i !== 0
        ? currentRoom!.findEventById(sortedEvents[i - 1]?.[0] || "") ?? null
        : null;

    if (list.length === 1 && firstEvent.getType() !== EventType.RoomMessage) {
      return (
        <>
          <DayBreak previous={previous} current={firstEvent} />
          <StateFrame userId={firstEvent.getSender()!}>
            {list.map((id) => eventRecord[id]!)}
          </StateFrame>
        </>
      );
    }

    // ref={latestMessage ? ref : null}
    return (
      <>
        <DayBreak previous={previous} current={firstEvent} />
        <MessageFrame
          userId={firstEvent.getSender()!}
          displayName={displayName}
          timestamp={firstEvent.getTs()}
        >
          {list.map((id) => eventRecord[id]!)}
        </MessageFrame>
      </>
    );
  });
};

// <button
//   className="p-1 bg-indigo-200 border-2 border-gray-400 rounded-md mb-2"
//   onClick={() =>
//     console.log(
//       list.map((id) => currentRoom?.findEventById(id)?.getContent()),
//     )
//   }
// >
//   events
// </button>

const isDifferentDay = (previous: MatrixEvent, current: MatrixEvent) => {
  const previousDate = new Date(previous.getTs());
  const date = new Date(current.getTs());

  return date.getDate() !== previousDate.getDate();
};

const DayBreak = ({
  previous,
  current,
}: {
  previous: MatrixEvent | null;
  current: MatrixEvent;
}) => {
  if (!previous || !isDifferentDay(previous, current)) {
    return null;
  }

  return <DateMessage date={new Date(current.getTs())} />;
};

const TitleBar = ({
  roomName,
  roomState,
  showMembers,
  setShowMembers,
}: {
  roomName: string;
  roomState: RoomState | null;
  showMembers: boolean;
  setShowMembers: (_: boolean) => void;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="flex min-h-[42px] items-center justify-between text-gray-800 bg-opacity-50 bg-blue-300 px-4"
      id="header"
    >
      <Modal
        title={roomName}
        visible={visible}
        setVisible={setVisible}
        className="p-4"
      >
        <p>
          {
            roomState?.events.get(EventType.RoomTopic)?.get("")?.getContent()
              .topic
          }
        </p>
      </Modal>
      <button className="truncate shrink" onClick={() => setVisible(true)}>
        <span className="font-bold">{roomName}</span>
        {(
          <>
            {roomState?.events
              .get(EventType.RoomTopic)
              ?.get("")
              ?.getContent() ? (
              <>
                <span className="border-indigo-800 ml-[6px] min-h-[150%] border-l-[2px] mr-[4px]" />
                {
                  roomState?.events
                    .get(EventType.RoomTopic)
                    ?.get("")
                    ?.getContent().topic
                }
              </>
            ) : null}
          </>
        ) ?? ""}
      </button>
      <div className="relative grow basis-4 flex justify-end">
        <button
          className="invert bg-inherit"
          onClick={() => setShowMembers(!showMembers)}
        >
          <MembersIcon />
        </button>
      </div>
    </div>
  );
};

export default MessageWindow;
