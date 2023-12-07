import {
  EventType,
  IStatusResponse,
  MatrixEvent,
} from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RoomContext } from "../providers/room";
import MembersIcon from "./icons/Members";
import MemberList from "./MemberList";
import { filterRecord, getAnnotations, getRedactions, getReplacements } from "../lib/helpers";

const groupEventsByTs = (events: MatrixEvent[]) =>
  events.reduce(
    (init, event, i) => {
      if (i === 0) {
        return { [event.getTs()]: [event] };
      }

      const initArr = Object.entries(init);

      const [previousTimestamp, previousEvents] = initArr[initArr.length - 1]!;
      // we enter a new entry with the latest timestamp
      delete init[previousTimestamp];

      const diff = event.getTs() - parseInt(previousTimestamp);

      return diff < 60 * 1000 &&
        previousEvents[0]!.getSender() === event.getSender() &&
        event.getType() === EventType.RoomMessage &&
        previousEvents[0]!.getType() === EventType.RoomMessage
        ? {
            ...init,
            [event.getTs()]: [...previousEvents, event],
          }
        : { ...init, [previousTimestamp]: previousEvents, [event.getTs()]: [event] };
    },
    {} as Record<string, MatrixEvent[]>,
  );

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
  }, [currentRoom, bottomDivRef]);

  if (!events || !currentRoom) {
    return <div></div>;
  }

  return (
    <div className="basis-1/2 justify-between grow">
      <div className="flex">
        <div className="flex flex-col max-h-screen grow">
          <TitleBar
            showMembers={showMembers}
            setShowMembers={setShowMembers}
            roomName={currentRoom.name}
          />
          <div
            ref={bottomDivRef}
            className="overflow-y-auto bg-green-100"
          >
            <MessagesWithDayBreak events={Object.values(events)} />
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
    </div>
  );
};

const TimeLine = ({ events }: { events: MatrixEvent[] }) => {
  const allAnnotations = getAnnotations(events);
  const allReplacements = getReplacements(events);
  const allRedactions = getRedactions(events);

  return events.map(event => <Message event={event} annotations={allAnnotations[event.getId()!]} replacements={allReplacements[event.getId()!]} />)
  // return reply + event + annotations
}

// export const MessagesWithDayBreak = ({ events }: { events: MatrixEvent[] }) => {

//   const groupedEvents = Object.entries(events);
//   const getPrevious = (i: number) => groupedEvents[i - 1]!;

//   return groupedEvents.map(([timestamp, events], i) => {
//     const ids = events.map((e) => e.getId()!);
//     const annotations = filterRecord(ids, allAnnotations);
//     const replacements = filterRecord(ids, allReplacements);

//     if (events.length === 0 || events.every(e => !!e.getRelation())) {
//       return null;
//     }

//     if (i === 0) {
//       return (
//         <Message
//           events={events}
//           annotations={annotations}
//           replacements={replacements}
//           key={i}
//         />
//       );
//     }

//     const [previousTimestamp, _] = getPrevious(i);
//     const date = new Date(parseInt(timestamp));
//     const previousDate = new Date(parseInt(previousTimestamp));

//     const dayBreak = date.getDate() !== previousDate.getDate();

//     return dayBreak && events.some(e => e.getType() === EventType.RoomMessage) ? (
//       <>
//         <DateMessage date={date} />
//         <Message events={events} replacements={replacements} key={i} />
//       </>
//     ) : (
//       <Message events={events} replacements={replacements} key={i} />
//     );
//   });
// };

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
