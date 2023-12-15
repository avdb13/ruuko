import { EventType, MatrixEvent, RelationType, RoomState } from "matrix-js-sdk";
import Message, {
  DateMessage,
  Membership,
  MessageFrame,
  StateFrame,
} from "./Message";
import InputBar from "./InputBar";
import {
  Ref,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RoomContext } from "../providers/room";
import MembersIcon from "./icons/Members";
import MemberList from "./MemberList";
import { getAnnotations, getRedactions, getReplacements } from "../lib/helpers";
import Modal from "./Modal";
import { ClientContext } from "../providers/client";
import Loader from "./Loader";

// in case we have performance issues later
// type SortingMetadata = {
//   sender: string, timestamp: number, id: string,
// }

const sortByTimestamp = (events: MatrixEvent[]) =>
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
  const { currentRoom, roomEvents, roomStates, setRoomEvents } =
    useContext(RoomContext)!;
  const client = useContext(ClientContext);

  const bottomDivRef = useRef<HTMLUListElement>(null);
  const observerRef = useRef<Element>();
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!currentRoom) {
    return <div></div>;
  }

  // TODO: fix key navigation

  // // needed?
  const eventsMemo = useMemo(() => {
    // default value not good
    return Object.values(roomEvents[currentRoom!.roomId] || {});
  }, [currentRoom, roomEvents]);

  console.log(Object.values(roomEvents).map(v => Object.values(v).length))

  useLayoutEffect(() => {
    const list = document.getElementById("bottom-div");

    observerRef.current =
      list?.children?.item(list?.children.length - 1) ?? undefined;
    list?.scroll(0, 0);
  }, [currentRoom]);

  // layout effect necessary?
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loading) {
        console.log("intersecting");

        setLoading(true);

        client.scrollback(currentRoom, eventsMemo.length + 50).then((r) => {
          // WARNING: we're inside a map, React batches updates so we have to pass a closure to use `previousEvents` here
          setRoomEvents({
            ...roomEvents,
            [r.roomId]: r
              .getLiveTimeline()
              .getEvents()
          });

          console.log("finished loading more events", Object.values(roomEvents[currentRoom.roomId]!).length);
          setLoading(false);
        });
      }
    });

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      observerRef.current ? observer.unobserve(observerRef.current) : null;
    };
  }, [observerRef]);

  if (currentRoom?.getMyMembership() === Membership.Ban) {
    return (
      <div className="relative basis-1/2 max-h-screen grow">
        <div className="absolute open:animate-modal modal w-[40%] border-2 border-indigo-50 bg-white shadow-md rounded-sm top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 py-8">
          <p className="py-2 text-lg text-gray-800 font-bold text-center">
            you were banned from this room
          </p>
          <p className="py-2 text-center text-gray-800">
            reason:{" "}
            {eventsMemo[eventsMemo.length - 1]?.getContent().reason ??
              "unknown"}
          </p>
        </div>
      </div>
    );
  }

  // fix harsh transition
  return (
    <div className="min-w-0 flex grow">
      <div className="min-w-0 flex flex-col basis-1/2 justify-between h-screen grow">
        <TitleBar
          showMembers={showMembers}
          setShowMembers={setShowMembers}
          roomState={roomStates[currentRoom.roomId] || null}
          roomName={currentRoom.name}
        />
        <ul
          ref={bottomDivRef}
          className="overflow-y-scroll scrollbar flex flex-col justify-start mt-auto scale-y-[-1] [&>*]:scale-y-[-1] [&>*]:list-none overflow-x-clip"
          id="bottom-div"
        >
          <Timeline events={eventsMemo} />
          {loading ? (
            <div className="h-24 shrink-0 flex items-center">
              <Loader className="bg-transparent w-full" />
            </div>
          ) : null}
        </ul>
        <InputBar roomId={currentRoom.roomId} />
      </div>
      {showMembers ? <MemberList setVisible={setShowMembers} /> : null}
    </div>
  );
};

const Timeline = ({ events }: { events: MatrixEvent[] }) => {
  const { currentRoom } = useContext(RoomContext)!;

  // what if we have a replaced reaction???
  // reduce a step earlier?
  const filteredEvents = [...Array(events.length).keys()].reduce(
    (init, i) => {
      const e = events[events.length - i - 1]!;

      switch (e.getType()) {
        case EventType.Reaction:
          return {
            ...init,
            [EventType.Reaction]: [...init[EventType.Reaction]!, e],
          };
        case EventType.Receipt:
          return {
            ...init,
            [EventType.Receipt]: [...init[EventType.Receipt]!, e],
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
      [EventType.Receipt]: [],
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
          <StateFrame key={firstEvent.getId()!} userId={firstEvent.getSender()!}>
            {list.map((id) => eventRecord[id]!)}
          </StateFrame>
        </>
      );
    }

    return (
      <>
        <DayBreak previous={previous} current={firstEvent} />
        <MessageFrame
          key={firstEvent.getId()!}
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
      <Modal title={roomName} visible={visible} setVisible={setVisible}>
        <p>
          {
            roomState?.events.get(EventType.RoomTopic)?.get("")?.getContent()
              .topic
          }
        </p>
      </Modal>
      <button
        className="truncate shrink outline-none"
        onClick={() => setVisible(true)}
      >
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
          className="bg-inherit"
          onClick={() => setShowMembers(!showMembers)}
        >
          <MembersIcon className="fill-current text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default MessageWindow;
