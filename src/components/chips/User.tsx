import { useContext } from "react";
import { DisplayedMember, fallbackMxcUrlToHttp } from ".";
import { ClientContext } from "../../providers/client";

const UserChip = ({
  member,
  closeModal,
}: {
  member: DisplayedMember;
  closeModal: () => void;
}) => {
  const client = useContext(ClientContext);
  const src = fallbackMxcUrlToHttp(client, member.avatar_url);

  const createRoom = () => {
    closeModal();
    client.createRoom({ is_direct: true, invite: [member.user_id] });
  };

  return (
    <button
      className="flex border-2 p-2 items-center"
      key={member.user_id}
      onClick={createRoom}
    >
      <img src={src} alt={member.user_id} className="rounded-full w-8 h-8" />
      <p className="px-1">{member.display_name}</p>
      <p className="text-zinc-500">{member.user_id}</p>
    </button>
  );
};

export default UserChip;
