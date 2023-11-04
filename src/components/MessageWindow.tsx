import { EventType, Room } from "matrix-js-sdk";
import Message from "./Message";

const MessageWindow = ({ room }: {  room: Room }) => {
  const events = room.getLiveTimeline().getEvents();

  return (
    <div className="flex flex-col basis-full flex-grow flex-nowrap max-h-screen">
      <div className="basis-12 bg-slate-600" id="header">
        <p className="flex justify-center">{room.name}</p>
      </div>
      <div className="flex flex-col overflow-y-auto bg-green-100 scrollbar grow justify-end">
        <ul className="flex flex-col bg-slate-400">
          {events
            .filter((event) => event.getType() === EventType.RoomMessage)
            .map((messageEvent, i) => <Message message={messageEvent} key={i} />)}
        </ul>
      </div>
    </div>
  );
};

export default MessageWindow;
