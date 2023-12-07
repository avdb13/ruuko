import {
  EventType,
  IStatusResponse,
  MatrixEvent,
  RelationType,
} from "matrix-js-sdk";
import Message, { MessageFrame } from "./Message";
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

  console.log(Object.values(events || {}).map(e => e.getContent().body))

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
    <div className="basis-1/2 justify-between grow">
      <div className="flex">
        <div className="flex flex-col max-h-screen grow">
          <TitleBar
            showMembers={showMembers}
            setShowMembers={setShowMembers}
            roomName={currentRoom.name}
          />
          <div ref={bottomDivRef} className="overflow-y-auto bg-green-100">
            <TimeLine events={Object.values(events)} />
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
  const { currentRoom } = useContext(RoomContext)!;

  const isSpecialEvent = (e: MatrixEvent) =>
    e.getRelation() ||
    e.getRedactionEvent() ||
    // EventType.RoomRedaction === e.getType() ||
    EventType.Reaction === e.getType();

  const filteredEvents = events.reduce(
    (init, e) =>
      isSpecialEvent(e)
        ? { ...init, ["others"]: [...(init["others"] ?? []), e] }
        : { ...init, ["regular"]: [...(init["regular"] ?? []), e] },
    { others: [], regular: [] } as Record<string, MatrixEvent[]>,
  );

  const allAnnotations = getAnnotations(filteredEvents["others"]!);
  const allReplacements = getReplacements(filteredEvents["others"]!);
  const allRedactions = getRedactions(filteredEvents["others"]!);

  // return reply + event + annotations
  const eventRecord = filteredEvents["regular"]!.reduce(
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

  return sortByTimestamp(filteredEvents["regular"]!).map((list) => {
    const firstEvent = currentRoom?.findEventById(list[0]!)!;
    const displayName = firstEvent.getContent().displayname;

    return (
      <MessageFrame
        userId={firstEvent.getSender()!}
        displayName={displayName}
        timestamp={firstEvent.getTs()}
      >
        {list.map((id) => eventRecord[id]!)}
      </MessageFrame>
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
