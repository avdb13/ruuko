import { EventType, IStatusResponse, MatrixEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RoomContext } from "../providers/room";
import MembersIcon from "./icons/Members";
import MemberList from "./MemberList";
import { ClientContext } from "../providers/client";

const getSender = (event: MatrixEvent | Record<string, MatrixEvent>) => {
  // better type guarding tomorrow
  if (event instanceof MatrixEvent) {
    return event.getSender();
  } else {
    return Object.entries(event)[0]![1].getSender();
  }
};

const groupEventsByTs = (events: Record<string, MatrixEvent>) =>
  Object.entries(events || {}).reduce(
    (init, [eventId, event], i) => {
      if (i === 0) {
        return { [event.getTs()]: event };
      }

      const initEntries = Object.entries(init);
      const [previousTimestamp, previousEvent] =
        initEntries[initEntries.length - 1]!;
      const diff = event.getTs() - parseInt(previousTimestamp);

      if (
        diff < 60 * 1000 &&
        getSender(previousEvent) === event.getSender() &&
        event.getType() === EventType.RoomMessage
      ) {
        if (previousEvent instanceof MatrixEvent) {
          return {
            ...init,
            [previousTimestamp]: {
              [previousEvent.getId()!]: previousEvent,
              [eventId]: event,
            },
          };
        } else {
          return {
            ...init,
            [previousTimestamp]: {
              ...(previousEvent || {}),
              [eventId]: event,
            },
          };
        }
      } else {
        return { ...init, [event.getTs()]: event };
      }
    },
    {} as Record<number, Record<string, MatrixEvent> | MatrixEvent>,
  );

const MessageWindow = () => {
  // no idea why roomEvents doesn't contain replies.
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const client = useContext(ClientContext);

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
            className="overflow-y-auto bg-green-100 scrollbar"
          >
            <MessagesWithDayBreak events={events} />
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

export const MessagesWithDayBreak = ({
  events,
}: {
  events: Record<string, MatrixEvent>;
}) => {
  const groupedEvents = Object.entries(groupEventsByTs(events));
  const getPrevious = (i: number) => groupedEvents[i - 1]!;

  return groupedEvents.map(([timestamp, events], i) => {
    if (i === 0) {
      return <Message events={events} key={i} />;
    }

    const [previousTimestamp, _] = getPrevious(i);
    const date = new Date(parseInt(timestamp));
    const previousDate = new Date(parseInt(previousTimestamp));

    const sameDay = date.getDate() === previousDate.getDate();

    return sameDay ? (
      <Message events={events} key={i} />
    ) : (
      <>
        <DateMessage date={date} />
        <Message events={events} key={i} />
      </>
    );
  });
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
