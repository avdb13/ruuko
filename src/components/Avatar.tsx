import { memo, useContext } from "react";
import { ClientContext } from "../providers/client";
import { getAvatarUrl } from "../lib/helpers";
import { RoomContext } from "../providers/room";

export type AvatarType = "user" | "room";

const Avatar = memo(function Avatar ({
  id,
  type,
  size,
  className,
}: {
  id: string;
  type: AvatarType;
  size: number;
  className?: string;
}) {
  const client = useContext(ClientContext);
  const { avatars, setAvatars } = useContext(RoomContext)!;


  const src = avatars[id] ? avatars[id] : getAvatarUrl(client, id, type);
  if (!avatars[id] && src) {
    setAvatars(({...avatars, [id]: src }))
  }

  return (
    <img
      src={src || "/public/anonymous.jpg"
      }
      className={
        `bg-white object-cover self-start rounded-full border-4` + " " + className
      }
      style={{ height: size * 4, width: size * 4, minWidth: size * 4 }}
    />
  );
});

export const DirectAvatar = memo(function DirectAvatar ({
  url,
  size,
  className,
}: {
  url?: string;
  size: number;
  className?: string;
}) {
  const client = useContext(ClientContext);

  return (
    <img
      src={
        url ? client.mxcUrlToHttp(url, 1200, 1200, "scale", true) ||
        "/public/anonymous.jpg" : "/public/anonymous.jpg"
      }
      className={
        `bg-white object-cover self-start rounded-full border-4` + " " + className
      }
      style={{ height: size * 4, width: size * 4, minWidth: size * 4 }}
    />
  );
});

export default Avatar;
