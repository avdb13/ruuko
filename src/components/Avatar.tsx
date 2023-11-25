import { useContext } from "react";
import { ClientContext } from "../providers/client";
import { getAvatarUrl } from "../lib/helpers";

export type AvatarType = "user" | "room";

const Avatar = ({ id, type, size }: { id: string, type: AvatarType, size: number }) => {
  const client = useContext(ClientContext);

  return (
    <img
      src={getAvatarUrl(client, id, type) || "/public/anonymous.jpg"}
      className={`object-cover self-start rounded-full border-4`}
      style={{height: size*4, width: size*4, minWidth: size*4}}
    />
  )

}

export default Avatar
