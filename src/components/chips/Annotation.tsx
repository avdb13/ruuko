import { EventType, MatrixEvent, RelationType, RoomMember } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../../providers/client";
import { mxcUrlToHttp } from "../../lib/helpers";
import { RoomContext } from "../../providers/room";

const Annotation = ({
  annotation,
  annotators,
  eventId,
}: {
  annotation: MatrixEvent;
  annotators: RoomMember[];
  eventId: string;
}) => {
  const client = useContext(ClientContext);
  const { currentRoom } = useContext(RoomContext)!;

  const annotatorsExample = [client.getUserId()!];

  const key = annotation.getContent()["m.relates_to"]?.key;
  const src = mxcUrlToHttp(client, key!);
  const anchorContent = annotatorsExample.length === 1 ? "bobby and mary" : "";

  const handleClick = () => {
    if (annotatorsExample.find(a => a === client.getUserId()!)) {
      client.redactEvent(currentRoom!.roomId!, annotation.getId()!);
    } else {
      client.sendEvent(currentRoom!.roomId!, EventType.Reaction, {"m.relates_to": {event_id: eventId, key, rel_type: RelationType.Annotation }});
    }
  };

  return (
    <div className="group">
      <button className="relative z-0 w-[50px] h-[30px] flex justify-center items-center gap-1 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all text-gray-600 rounded-md">
          {key?.startsWith("mxc") ? (
            <img src={src} className="h-5" alt={key} />
          ) : (
            key
          )}
          <p className="font-bold">5</p>
    <div className="absolute z-10 w-[200px] h-[40px] bottom-[45px] group-hover:bottom-[35px] shadow-sm shadow-black flex justify-center items-center opacity-0 bg-black text-white font-bold rounded-md group-hover:opacity-100 transition-opacity" style={{transition: "all 0.2s ease-in-out"}} id="annotation-button">
            <p>{anchorContent}</p>
          </div>
      </button>
    </div>
  );
};

export default Annotation;
