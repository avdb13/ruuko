import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { RoomContext } from "./room";
import { ClientContext } from "./client";
import { EventType, Room } from "matrix-js-sdk";

export const AvatarContext = createContext<AvatarCache | null>(null);

export type AvatarCache = {
  avatars: Record<string, string>;
  setAvatars: (_: Record<string, string>) => void;
  ready: boolean;
};

const AvatarProvider = (props: PropsWithChildren) => {
  const { roomEvents, rooms } = useContext(RoomContext)!;
  const client = useContext(ClientContext);

  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  const length = Object.keys(avatars ?? {});
  const avatarsMemo = useMemo(() => avatars ?? {}, [length]);

  const directEvent = client.getAccountData(EventType.Direct);
  const directRoomIds = Object.values(
    directEvent?.getContent() as Record<string, string[]>,
  ).flat();
  const direct = (r: Room) => directRoomIds.indexOf(r.roomId) >= 0;

  useEffect(() => {
    const id = client.getUserId()!;
    const url = client.getUser(id)?.avatarUrl!;
    setAvatars((prev) => ({
      ...prev,
      [id]: client.mxcUrlToHttp(url, 1000, 1000)!,
    }));

    const allAvatars = rooms.reduce(
      (init, r) => {
        const memberAvatars = (roomEvents[r.roomId] ?? []).reduce(
          (init, m) => {
            const id = m.event.getSender();
            const url = m.event.sender?.getMxcAvatarUrl();
            if (!id) return init;

            const memberAvatar = url ? client.mxcUrlToHttp(url, 1000, 1000) : "/anonymous.jpg";
            return memberAvatar ? { ...init, [id]: memberAvatar } : init;
          },
          {} as Record<string, string>,
        );

        const members = r.getMembers();
        const otherMemberUrl = members
          .filter((m) => m.userId !== client.getUserId()!)[0]
          ?.getMxcAvatarUrl();
        const url = direct(r) ? otherMemberUrl : r.getMxcAvatarUrl();

        const roomAvatar = url ? client.mxcUrlToHttp(url, 1000, 1000) : "/anonymous.jpg";

        return roomAvatar
          ? { ...init, ...memberAvatars, [r.roomId]: roomAvatar }
          : { ...init, ...memberAvatars };
      },
      {} as Record<string, string>,
    );

    setAvatars((prev) => ({ ...prev, ...allAvatars }));
    setReady(true);
  }, []);

  return (
    <AvatarContext.Provider
      value={{
        avatars: avatarsMemo,
        setAvatars,
        ready,
      }}
    >
      {props.children}
    </AvatarContext.Provider>
  );
};

export default AvatarProvider;
