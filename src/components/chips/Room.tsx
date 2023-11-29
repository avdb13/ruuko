import { IPublicRoomsChunkRoom } from "matrix-js-sdk";
import { useContext } from "react";
import { ClientContext } from "../../providers/client";
import { RoomContext } from "../../providers/room";
import { DirectAvatar } from "../Avatar";

const RoomChip = ({
  room,
  closeModal,
}: {
  room: IPublicRoomsChunkRoom;
  closeModal: () => void;
}) => {
  const client = useContext(ClientContext);
  const { setCurrentRoom } = useContext(RoomContext)!;

  const joinRoom = () => {
    closeModal();
    client.joinRoom(room.room_id).then(room => setCurrentRoom(room));
  };

  return (
    <button
      className="flex border-2 p-2 items-center gap-2"
      key={room.room_id}
      onClick={joinRoom}
    >
      <DirectAvatar url={room.avatar_url!} size={8} />
      <div className="flex flex-col min-w-0 items-start">
        <p className="px-1">{room.name}</p>
        <p className="text-zinc-500 truncate max-w-full">{room.topic}</p>
      </div>
    </button>
  );
};


export default RoomChip;
