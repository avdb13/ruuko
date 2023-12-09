import {
  EventType,
  IStatusResponse,
  MatrixEvent,
  RelationType,
} from "matrix-js-sdk";
import Message, { DateMessage, MessageFrame, StateFrame } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RoomContext } from "../providers/room";
import MembersIcon from "./icons/Members";
import MemberList from "./MemberList";
import { getAnnotations, getRedactions, getReplacements } from "../lib/helpers";

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
  const { currentRoom, roomEvents } = useContext(RoomContext)!;

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

  const events = useMemo(
    () => roomEvents[currentRoom!.roomId],
    [currentRoom, roomEvents],
  );

  useEffect(() => {
    console.log("scroll to bottom " + currentRoom?.name);
    if (events) {
      if (bottomDivRef.current) {
        const scroll =
          bottomDivRef.current.scrollHeight - bottomDivRef.current.clientHeight;
        bottomDivRef.current.scrollTo(0, scroll);
      }
    }
  }, [events]);

  if (!events || !currentRoom) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col basis-1/2 justify-between max-h-screen grow">
      <TitleBar
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        roomName={currentRoom.name}
      />
      <div>
        <div
          ref={bottomDivRef}
          className="overflow-y-auto bg-green-100"
          id="bottom-div"
        >
          <Timeline events={Object.values(events)} />
        </div>
        <InputBar roomId={currentRoom.roomId} />
      </div>
      {showMembers ? (
        <MemberList
          room={currentRoom}
          presences={presences}
          setShowMembers={setShowMembers}
        />
      ) : null}
    </div>
  );
};

const Timeline = ({ events }: { events: MatrixEvent[] }) => {
  const { currentRoom } = useContext(RoomContext)!;

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
          return e.getRelation()?.rel_type === RelationType.Replace
            ? {
                ...init,
                [RelationType.Replace]: [...init[RelationType.Replace]!, e],
              }
            : { ...init, ["rest"]: [...init["rest"]!, e] };
      }
    },
    {
      [EventType.Reaction]: [],
      [EventType.RoomRedaction]: [],
      [RelationType.Replace]: [],
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
          <StateFrame userId={firstEvent.getSender()!}>
            {list.map((id) => eventRecord[id]!)}
          </StateFrame>
          <DayBreak previous={previous} current={firstEvent} />
        </>
      );
    }

    return (
      <>
        <MessageFrame
          userId={firstEvent.getSender()!}
          displayName={displayName}
          timestamp={firstEvent.getTs()}
        >
          {list.map((id) => eventRecord[id]!)}
        </MessageFrame>
        <DayBreak previous={previous} current={firstEvent} />
      </>
    );
  });
};

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
  showMembers,
  setShowMembers,
}: {
  roomName: string;
  showMembers: boolean;
  setShowMembers: (_: boolean) => void;
}) => {
  return (
    <div
      className="flex basis-8 justify-between items-center text-white bg-slate-600 px-4"
      id="header"
    >
      <p className="whitespace-normal break-all">{roomName}</p>
      <div>
        <button className="invert" onClick={() => setShowMembers(!showMembers)}>
          <MembersIcon />
        </button>
      </div>
    </div>
  );
};

export default MessageWindow;
