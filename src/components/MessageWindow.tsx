import { MatrixEvent, Room, RoomEvent } from "matrix-js-sdk";
import Message, { DateMessage } from "./Message";
import InputBar from "./InputBar";
import { useContext, useEffect, useRef, useState } from "react";
import { ClientContext } from "../providers/client";
import { isAnnotation } from "../lib/eventFormatter";

const addAnnotation = (
  event: ExtendedEvent,
  events: Map<string, ExtendedEvent>,
  setEvents: (_: Map<string, ExtendedEvent>) => void,
) => {
  const id = event.getContent()["m.relates_to"]?.event_id;
  const relatedEvent = events.get(id!)!;

  const newEvent: ExtendedEvent = {
    ...relatedEvent,
    annotations: [
      ...(relatedEvent.annotations || []),
      event as MatrixEvent,
    ],
  };

  const newEvents: Map<string, ExtendedEvent> = {
    ...events,
    [relatedEvent.getId()!]: newEvent,
  };
  setEvents(newEvents);
};

const eventsToMap = (events: MatrixEvent[]): Map<string, ExtendedEvent> => {
  return new Map(
    events.map((e) => [e.getId()!, { inner: e } as ExtendedEvent]),
  );
};

const mapToEvents = (map: Map<string, ExtendedEvent>) =>
  Object.values(map) as ExtendedEvent[];

const MessageWindow = ({ currentRoom }: { currentRoom: Room }) => {
  const client = useContext(ClientContext);
  const [events, setEvents] = useState<Map<string, ExtendedEvent>>(new Map());
  const bottomDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("useEffect");
    client
      .scrollback(currentRoom, Number.MAX_SAFE_INTEGER)
      .then((scrollback) => {
        setEvents(eventsToMap(scrollback.getLiveTimeline().getEvents()));
      });
  }, [currentRoom]);

  useEffect(() => {
    if (events) {
      bottomDivRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [events]);

  if (!events) {
    return <div></div>;
  }

  client.on(RoomEvent.Timeline, (originalEvent, room, startOfTimeline) => {
    const event = { inner: originalEvent } as ExtendedEvent;

    const eventArr = mapToEvents(events);
    // weird bug that gets triggered the message twice
    if (startOfTimeline || eventArr[eventArr.length - 1] === event) {
      return;
    }

    if (room?.roomId === currentRoom.roomId) {
      console.log("event: ", event.inner.getContent().membership);

      if (isAnnotation(event.inner)) {
        addAnnotation(event, events, setEvents);
      } else {
        setEvents({ ...events, [event.inner.getId()!]: event });
      }
    }
  });

  return (
    <div className="flex flex-1 flex-col max-h-screen shrink basis-1/2 min-h-full justify-between">
      <div className="bg-slate-600" id="header">
        <p className="flex justify-center">{currentRoom.name}</p>
      </div>
      <div className="overflow-y-auto">
        <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar">
          <MessagesWithDayBreak events={mapToEvents(events)} />
        </div>
        <InputBar roomId={currentRoom.roomId} />
        <div id="autoscroll-bottom" ref={bottomDivRef}></div>
      </div>
    </div>
  );
};

export const MessagesWithDayBreak = ({
  events,
}: {
  events: ExtendedEvent[];
}) => {
  return events.map((event, i) => {
    if (i === 0) {
      return <Message event={event} key={i} />;
    } else {
      const [messageTs, prevMessageTs] = [
        new Date(event.inner.getTs()),
        new Date(events[i - 1]!.inner.getTs()),
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
};

export default MessageWindow;
