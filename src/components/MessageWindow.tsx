import { EventType, IStatusResponse, MatrixEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RoomContext } from "../providers/room";
import MembersIcon from "./icons/Members";
import MemberList from "./MemberList";
import { ClientContext } from "../providers/client";

const getSender = (event: MatrixEvent | Record<string, MatrixEvent>) => {
  if (!!event.localTimestamp) {
    const e = event as MatrixEvent;

    return e.getSender();
  } else {
    const e = event as Record<string, MatrixEvent>;

    return Object.entries(e)[0]![1].getSender();
  }
}

const toRecord = (event: MatrixEvent | Record<string, MatrixEvent>) => {
  if (!!event.localTimestamp) {
    const e = event as MatrixEvent;

    return e.getSender();
  } else {
    const e = event as Record<string, MatrixEvent>;

    return Object.entries(e)[0]![1].getSender();
  }
}

const groupEventsByTs = (events: Record<string, MatrixEvent>) =>
  Object.entries(events || {}).reduce(
    (init, [eventId, event], i) => {
      if (i === 0) {
        return { [event.getTs()]: event };
      }

      const initEntries = Object.entries(init);
      const [previousTimestamp, previousEvent] = initEntries[initEntries.length - 1]!;

      const diff = event.getTs() - parseInt(previousTimestamp);

      return diff < 60 * 1000 && getSender(previousEvent) === event.getSender() && event.getType() === EventType.RoomMessage
        ? ({
            ...init,
            [previousTimestamp]: ({
              ...previousEvent || {},
              [eventId]: event,
            }),
          })
        : ({ ...init, [event.getTs()]:  event });
    },
    {} as Record<number, Record<string, MatrixEvent> | MatrixEvent>,
  );

const groupAnnotations = () => {
  //   const groupedAnnotations = annotations
  //     ? annotations.reduce(
  //         (record, a) => {
  //           const key = a.getContent()["m.relates_to"]?.key;
  //           const sender = a.getSender();
  //           const eventId = a.getId();
  //           return key && sender && eventId
  //             ? { ...record, [key]: [...(record[key] || []), [sender, eventId]] }
  //             : record;
  //         },
  //         {} as Record<string, string[][]>,
  //       )
  //     : null;
};

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
    if (events) {
      if (bottomDivRef.current) {
        const scroll = bottomDivRef.current.scrollHeight - bottomDivRef.current.clientHeight;
        bottomDivRef.current.scrollTo(0, scroll)
        console.log(scroll);
      }
    }
  }, [Object.values(events || {}).length, bottomDivRef]);

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
          <div ref={bottomDivRef} className="overflow-y-auto bg-green-100 scrollbar">
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
  events: Record<EventType, Record<string, MatrixEvent>>;
}) => {
  console.log(events);
  const newEvents = groupEventsByTs(Object.values(events).reduce((init, x) => ({...init, ...x}), {}));

  return Object.entries(newEvents).map(([timestamp, groupEvents], i) => {
    if (i === 0) {
      return (
        <Message
          events={groupEvents}
          key={i}
        />
      );
    }

    const date = new Date(parseInt(timestamp));

    const previousEvent =
      Object.entries(newEvents)[Object.entries(events).length - 1]!;
    const previousDate = new Date(parseInt(previousEvent[0]));

    console.log(timestamp, previousEvent[0]);

    return previousDate.getDate() === date.getDate() ? (
      <Message events={groupEvents} key={i} />
    ) : (
      <>
        <DateMessage date={previousDate} />
        <Message events={groupEvents} key={i} />
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
