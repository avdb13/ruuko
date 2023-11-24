import { MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useRef, useState } from "react";
import { ClientContext } from "../providers/client";
import { isAnnotation } from "../lib/eventFormatter";

const arrToMap = (events: MatrixEvent[]): Map<string, MatrixEvent> => {
  return new Map(events.map((e) => [e.getId()!, e as MatrixEvent]));
};

const mapToArr = (map: Map<string, MatrixEvent>) =>
  Array.from(map.values());

const MessageWindow = ({ currentRoom }: { currentRoom: Room }) => {
  const client = useContext(ClientContext);
  const [events, setEvents] = useState<Map<string, MatrixEvent>>(new Map());
  const [annotations, setAnnotations] = useState<Map<string, MatrixEvent[]>>(new Map());
  const bottomDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("useEffect");

    client
      .scrollback(currentRoom, Number.MAX_SAFE_INTEGER)
      .then((scrollback) => {
        const timeline = scrollback.getLiveTimeline().getEvents();
        const events = timeline.filter(e => !isAnnotation(e))
        const annotationsArr = timeline.filter(isAnnotation);

        const eventMap = arrToMap(events);
        setAnnotations(new Map());
        setEvents(eventMap);

        for (const annotation of annotationsArr) {
          const key = annotation.getContent()["m.relates_to"]?.event_id;
          const newAnnotations: MatrixEvent[] = [...(annotations.get(key!) || []), annotation];

          setAnnotations(annotations.set(key!, newAnnotations))
        }
      });
  }, [currentRoom]);

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

  if (!events) {
    return <div></div>;
  }

  client.on(RoomEvent.Timeline, (originalEvent, room, startOfTimeline) => {
    const event = originalEvent as MatrixEvent;

    const eventArr = mapToArr(events);
    // weird bug that gets triggered the message twice
    if (startOfTimeline || eventArr[eventArr.length - 1] === event) {
      return;
    }

    if (room?.roomId === currentRoom.roomId) {
      console.log("event: ", event.getContent().membership);
    }
  });

  return (
    <div className="flex flex-col max-h-screen basis-1/2 justify-between grow">
      <div className="bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar">
          <MessagesWithDayBreak events={mapToArr(events)} annotations={annotations} />
        </div>
        <InputBar roomId={currentRoom.roomId} />
        <div id="autoscroll-bottom" ref={bottomDivRef}></div>
      </div>
    </div>
  );
};

export const MessagesWithDayBreak = ({ events, annotations }: { events: MatrixEvent[], annotations: Map<string, MatrixEvent[]> }) => {
  return events.map((event, i) => {
    if (i === 0) {
      return <Message event={event} key={i} annotations={annotations.get(event.getId()!)} />;
    } else {
      const [messageTs, prevMessageTs] = [
        new Date(event.getTs()),
        new Date(events[i - 1]!.getTs()),
      ];

      return prevMessageTs.getDate() === messageTs.getDate() ? (
        <Message event={event} key={i} annotations={annotations.get(event.getId()!)} />
      ) : (
        <>
          <DateMessage date={messageTs} />
          <Message event={event} key={i} annotations={annotations.get(event.getId()!)} />
        </>
      );
    }
  });
}

export default MessageWindow;
