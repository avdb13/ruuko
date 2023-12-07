import { EventType, IContent, RelationType } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../../providers/client";
import { RoomContext } from "../../providers/room";

export type Annotator = {
  user_id: string;
  event_id: string;
};

const Annotation = ({
  key,
  annotators,
  reply_id,
}: {
  key: string;
  annotators: Annotator[];
  reply_id: string;
}) => {
  const client = useContext(ClientContext);
  const { currentRoom } = useContext(RoomContext)!;

  const src = key.startsWith("mxc")
    ? client.mxcUrlToHttp(key, 40, 40, "scale", true)
    : null;

  const handleClick = () => {
    const myId = client.getUserId()!;
    const myAnnotation = annotators.find(({ user_id }) => user_id === myId);

    if (myAnnotation) {
      client.redactEvent(currentRoom!.roomId, myAnnotation.event_id);
    } else {
      const content: IContent = {
        "m.relates_to": {
          event_id: reply_id,
          key,
          rel_type: RelationType.Annotation,
        },
      };

      client.sendEvent(currentRoom!.roomId, EventType.Reaction, content);
    }
  };

  return (
    <div className="relative flex justify-center items-center gap-1">
      <button
        className="flex justify-center items-center gap-1 peer w-[50px] h-[30px] rounded-xl bg-gray-50 hover:bg-gray-100 transition-all text-gray-600 rounded-md border-2 "
        onClick={handleClick}
      >
        {src ? <img src={src} className="h-5" alt={key} /> : key}
        <p className="font-bold">{annotators.length}</p>
      </button>
      <div
        className="absolute p-1 w-[200px] bottom-[45px] peer-hover:bottom-[35px] peer-hover:opacity-100 transition-opacity shadow-sm shadow-black opacity-0 bg-black text-white font-bold rounded-md"
        style={{ transition: "all 0.2s ease-in-out" }}
        id="annotation-button"
      >
        <p className="text-center">{formatAnnotators(annotators)}</p>
      </div>
    </div>
  );
};

const formatAnnotators = (annotators: Annotator[]) => {
  const ids = annotators.map(({ user_id }) => user_id);

  switch (ids.length) {
    case 1:
      return ids[0];
    case 2:
      return `${ids[0]} and ${ids[1]}`;
    default:
      return `${ids[0]}, ${ids[1]} and ${ids.length - 2} others`;
  }
};

export default Annotation;
