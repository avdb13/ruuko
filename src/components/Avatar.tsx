import { memo, useContext, useEffect } from "react";
import { ClientContext } from "../providers/client";
import { AvatarContext } from "../providers/avatar";
import { MatrixClient, getHttpUriForMxc } from "matrix-js-sdk";

export type AvatarKind = "user" | "room";

type AvatarResponse = {
  url?: string;
  status: "success" | "fail" | "nonexistent";
};

export const getAvatarUrl = (
  client: MatrixClient,
  id: string,
  kind: AvatarKind,
): AvatarResponse => {
  const room = client.getRoom(id);
  const mxcUrl =
    kind === "user"
      ? client.getUser(id)?.avatarUrl
      : room
      ? room.getMembers().length > 2
        ? room.getMxcAvatarUrl()
        : room
            .getMembers()
            .find((m) => m.userId !== client.getUserId()!)
            ?.getMxcAvatarUrl() ?? null
      : null;

  if (!mxcUrl) {
    return { status: "nonexistent" };
  }

  const url = client.mxcUrlToHttp(mxcUrl);

  if (url && url.length > 0) {
    return { status: "success", url };
  } else {
    return { status: "fail" };
  }
};

const Avatar = memo(function Avatar({
  id,
  kind,
  size,
  className,
}: {
  id: string;
  kind: AvatarKind;
  size: number;
  className?: string;
}) {
  const client = useContext(ClientContext);
  const { avatars, setAvatars } = useContext(AvatarContext)!;

  useEffect(() => {
    if (!avatars[id]) {
      const resp = getAvatarUrl(client, id, kind);
      switch (resp.status) {
        case "success":
          setAvatars({ ...avatars, [id]: resp.url! });
          break;
        case "fail":
          setAvatars({ ...avatars, [id]: "/unknown.jpg" });
          break;
        case "nonexistent":
          setAvatars({ ...avatars, [id]: "/anonymous.jpg" });
          break;
      }
    }
  }, [])

  return (
    <img
      src={avatars[id]}
      className={
        `bg-white object-cover self-start rounded-full border-4` +
        " " +
        className
      }
      style={{ height: size * 4, width: size * 4, minWidth: size * 4 }}
    />
  );
});

export const DirectAvatar = memo(function DirectAvatar({
  url,
  size,
  className,
}: {
  url: string;
  size: number;
  className?: string;
}) {
  const client = useContext(ClientContext);

  return (
    <img
      src={client.mxcUrlToHttp(url) ?? "/public/unknown.jpg"}
      className={
        `bg-white object-cover self-start rounded-full border-4` +
        " " +
        className
      }
      style={{ height: size * 4, width: size * 4, minWidth: size * 4 }}
    />
  );
});

export default Avatar;
