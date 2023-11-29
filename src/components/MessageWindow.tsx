import { EventType, MatrixEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef } from "react";
import { RoomContext } from "../providers/room";

const MessageWindow = () => {
  // no idea why roomEvents doesn't contain replies.
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const bottomDivRef = useRef<HTMLDivElement>(null);
  const { annotations } = useContext(RoomContext)!;
  const roomAnnotations = annotations[currentRoom!.roomId] || {};

  const events = useMemo(
    () => roomEvents[currentRoom!.roomId] || {},
    [currentRoom, roomEvents],
  );

  useEffect(() => {
    if (events) {
      if (bottomDivRef) {
        bottomDivRef.current.scrollIntoView({
          behavior: "instant",
          block: "end",
        });
      }
    }
  }, [events, bottomDivRef]);

  if (!events || !currentRoom) {
    return <div></div>;
  }

  return (
    <div className="flex flex-col max-h-screen basis-1/2 justify-between grow">
      <div className="bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar">
          <MessagesWithDayBreak events={events} annotations={roomAnnotations} />
        </div>
        <InputBar roomId={currentRoom.roomId} />
        <div id="autoscroll-bottom" ref={bottomDivRef}></div>
      </div>
    </div>
  );
};

export const MessagesWithDayBreak = ({
  events,
  annotations,
}: {
  events: Record<string, MatrixEvent>;
  annotations: Record<string, MatrixEvent[]>;
}) => {
  const eventEntries = Object.entries(events);

  const eventsGroupedByTime = eventEntries.reduce(
    (init, [k, v], i) => {
      if (i === 0) {
        return [{[k]: v} as Record<string, MatrixEvent>]
      }

      const diff = v.getTs() - eventEntries[i - 1]![1].getTs();
      const sameSender = v.getSender() === eventEntries[i - 1]![1].getSender();

      const res = diff < 60*1000 && sameSender && v.getType() == EventType.RoomMessage ? [...init.splice(0, init.length-1), ({...init[init.length-1], [k]: v})] : [...init, ({[k]: v})];

      return res;
    }, [] as Record<string, MatrixEvent>[]
  );

  return eventsGroupedByTime.map((events, i) => {
      const newAnnotations = eventEntries.reduce((init, [_, event]) => {
        const eventId = event.getId()!;

        return annotations[eventId] ? ({...init, [eventId]: annotations[eventId]! }) : init;
      }, {} as Record<string, MatrixEvent[]>)

      if (i === 0) {
        return <Message events={Object.values(events)} key={i} annotations={newAnnotations} />;
      } else {
        return <Message events={Object.values(events)} key={i} annotations={newAnnotations} />
        // const [messageTs, prevMessageTs] = [
        //   new Date(eventEntries[eventEntries.length-1]![1].getTs()),
        //   new Date(eventEntries[0]![1].getTs()),
        // ];

        // return prevMessageTs.getDate() === messageTs.getDate() ? (
        //   <Message event={event} key={i} annotations={eventAnnotations} />
        // ) : (
        //   <>
        //     <DateMessage date={messageTs} />
        //     <Message event={event} key={i} annotations={eventAnnotations} />
        //   </>
        // );
      }

  });
};

export default MessageWindow;
