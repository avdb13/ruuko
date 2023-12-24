import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from "react";
import { RoomContext } from "./room";

export const AvatarContext = createContext<AvatarCache | null>(null);

export type AvatarCache = {
  avatars: Record<string, string>;
  setAvatars: (_: Record<string, string>) => void;
  avatarsReady: boolean | null;
}

const AvatarProvider = (props: PropsWithChildren) => {
  const {currentRoom} = useContext(RoomContext)!;

  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [avatarsReady, setAvatarsReady] = useState<Record<string, boolean>>({});

  const length = Object.keys(avatars ?? {});
  const avatarsMemo = useMemo(() => avatars ?? {}, [length]);

  useEffect(() => {
    if (currentRoom) {
      const avatarsLoaded = currentRoom.getMembers().map(m => m.userId).every(id => avatars[id]);
      setAvatarsReady(prev => ({...prev, [currentRoom.roomId]: avatarsLoaded}));
    }
  }, [avatars, currentRoom])

  return (
    <AvatarContext.Provider value={{avatars: avatarsMemo, setAvatars, avatarsReady: currentRoom ? avatarsReady[currentRoom!.roomId]! : null}}>
      {props.children}
    </AvatarContext.Provider>
  );
};

export default AvatarProvider;
