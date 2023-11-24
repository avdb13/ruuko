import { EventType, MatrixEvent, RoomMember } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../../providers/client";
import { mxcUrlToHttp } from "../../lib/helpers";
import { RoomContext } from "../../providers/room";

const Annotation = ({
  annotation,
  annotators,
}: {
  annotation: MatrixEvent;
  annotators: RoomMember[];
}) => {
  const annotatorsExample = [annotation.getSender()];

  const key = annotation.getContent()["m.relates_to"]?.key;
  const client = useContext(ClientContext);
  const src = mxcUrlToHttp(client, key!);
  const anchorContent = annotatorsExample.length === 1 ? "bobby and mary" : "";
  const { currentRoom } = useContext(RoomContext)!;

  const handleClick = () => {
    // client.sendEvent(currentRoom?.roomId, EventType.)
  };

  return (
    <div className="group">
      <div className="inline-flex items-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-600 px-2 py-1 ring-4 ring-inset ring-gray-500/10 rounded-md">
        <button onClick={handleClick}>
          {key?.startsWith("mxc") ? (
            <img src={src} className="h-5" alt={key} />
          ) : (
            key
          )}
        </button>
      </div>
      <div className="hidden bg-black text-white font-bold p-4 rounded-md group-hover:block transition-opacity">
        <p>{anchorContent}</p>
      </div>
    </div>
  );
};

export default Annotation;
