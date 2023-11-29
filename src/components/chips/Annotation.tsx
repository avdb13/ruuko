import { EventType, IContent, RelationType } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../../providers/client";
import { RoomContext } from "../../providers/room";
import { formatAnnotators } from "../../lib/eventFormatter";

const Annotation = ({
  annotation,
  annotators,
  eventId,
}: {
  annotation: string;
  annotators: string[];
  eventId: string;
}) => {
  const client = useContext(ClientContext);
  const { currentRoom } = useContext(RoomContext)!;

  const src = client.mxcUrlToHttp(annotation, 40, 40, "scale", true);

  const handleClick = () => {
    const myId = client.getUserId()!;
    const myAnnotation = annotators.find((sender) => sender === myId);

    if (myAnnotation) {
      client.redactEvent(currentRoom!.roomId!, myAnnotation[1]!);
    } else {
      const content: IContent = {
        "m.relates_to": {
          event_id: eventId,
          key: annotation,
          rel_type: RelationType.Annotation,
        },
      };
      client.sendEvent(currentRoom!.roomId!, EventType.Reaction, content);
    }
  };


  return (
    <div className="relative flex justify-center items-center gap-1">
      <button
        className="flex justify-center items-center gap-1 peer w-[50px] h-[30px] rounded-xl bg-gray-50 hover:bg-gray-100 transition-all text-gray-600 rounded-md border-2 "
        onClick={handleClick}
      >
        {annotation.startsWith("mxc") ? (
          <img src={src!} className="h-5" alt={annotation} />
        ) : (
          annotation
        )}
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

export default Annotation;
