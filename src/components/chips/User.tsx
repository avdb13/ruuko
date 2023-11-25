import { useContext } from "react";
import { DisplayedMember } from ".";
import { ClientContext } from "../../providers/client";
import { RoomContext } from "../../providers/room";
import Avatar, { DirectAvatar } from "../Avatar";

const UserChip = ({
  member,
  closeModal,
}: {
  member: DisplayedMember;
  closeModal: () => void;
}) => {
  const client = useContext(ClientContext);
  const { setCurrentRoom } = useContext(RoomContext)!;

  const createRoom = () => {
    closeModal();
    client.createRoom({ is_direct: true, invite: [member.user_id] })
      .then(({ room_id }) => setCurrentRoom(client.getRooms().find(room => room.roomId === room_id)!));
  };

  return (
    <button
      className="flex border-2 p-2 items-center"
      key={member.user_id}
      onClick={createRoom}
    >
      <DirectAvatar url={member.avatar_url!} size={8}  />
      <p className="px-1">{member.display_name}</p>
      <p className="text-zinc-500">{member.user_id}</p>
    </button>
  );
};

export default UserChip;
