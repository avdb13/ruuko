import { useContext } from "react";
import { ClientContext } from "../providers/client";
import { getAvatarUrl } from "../lib/helpers";

export type AvatarType = "user" | "room";

const Avatar = ({ id, type, size }: { id: string, type: AvatarType, size: number }) => {
  const client = useContext(ClientContext);

  return (
    <img
      src={getAvatarUrl(client, id, type)!}
      className={`object-cover self-start h-${size} w-${size} rounded-full border-2`}
    />
  )

}

export default Avatar
