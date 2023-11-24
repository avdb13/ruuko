import { MatrixEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useMemo, useRef } from "react";
import { RoomContext } from "../providers/room";

// const arrToMap = (events: MatrixEvent[]): Map<string, MatrixEvent> => {
//   return new Map(events.map((e) => [e.getId()!, e as MatrixEvent]));
// };

// const mapToArr = (map: Map<string, MatrixEvent>) =>
//   Array.from(map.values());

const MessageWindow = () => {
  const { currentRoom, roomEvents } = useContext(RoomContext)!;
  const bottomDivRef = useRef<HTMLDivElement>(null);

  const events = useMemo(() => roomEvents.get(currentRoom!.roomId) || [], [currentRoom, roomEvents]);

  // useEffect(() => {
  //       const messageArr = events.filter(e => !isAnnotation(e))
  //       const annotationsArr = events.filter(isAnnotation);

  //       for (const annotation of annotationsArr) {
  //         const key = annotation.getContent()["m.relates_to"]?.event_id;
  //         const newAnnotations: MatrixEvent[] = [...(annotations.get(key!) || []), annotation];

  //         setAnnotations(annotations.set(key!, newAnnotations))
  //       }
  // }, [currentRoom]);

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

  // client.on(RoomEvent.Timeline, (event, room, startOfTimeline) => {
  //   // weird bug that gets triggered the message twice
  //   if (startOfTimeline || events[events.length - 1] === event) {
  //     return;
  //   }
  // });

  return (
    <div className="flex flex-col max-h-screen basis-1/2 justify-between grow">
      <div className="bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar">
          <MessagesWithDayBreak events={events} />
        </div>
        <InputBar roomId={currentRoom.roomId} />
        <div id="autoscroll-bottom" ref={bottomDivRef}></div>
      </div>
    </div>
  );
};

export const MessagesWithDayBreak = ({ events }: { events: MatrixEvent[] }) => {
  return events.map((event, i) => {
    if (i === 0) {
      return <Message event={event} key={i} />;
    } else {
      const [messageTs, prevMessageTs] = [
        new Date(event.getTs()),
        new Date(events[i - 1]!.getTs()),
      ];

      return prevMessageTs.getDate() === messageTs.getDate() ? (
        <Message event={event} key={i} />
      ) : (
        <>
          <DateMessage date={messageTs} />
          <Message event={event} key={i} />
        </>
      );
    }
  });
}

export default MessageWindow;
