import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { RoomContext } from "./room";
import { getAvatarUrl } from "../components/Avatar";
import { ClientContext } from "./client";
import { EventEmitterEvents, EventType } from "matrix-js-sdk";

export const AvatarContext = createContext<AvatarCache | null>(null);

export type AvatarCache = {
  avatars: Record<string, string>;
  setAvatars: (_: Record<string, string>) => void;
  avatarsReady: boolean | null;
};

const AvatarProvider = (props: PropsWithChildren) => {
  const { roomEvents, currentRoom, rooms } = useContext(RoomContext)!;
  const client = useContext(ClientContext);

  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [avatarsReady, setAvatarsReady] = useState<Record<string, boolean> | null>(null);

  const length = Object.keys(avatars ?? {});
  const avatarsMemo = useMemo(() => avatars ?? {}, [length]);

  useEffect(() => {
    const id = client.getUserId()!;
    const url = client.getUser(id)?.avatarUrl!;
    setAvatars(prev => ({...prev, [id]: client.mxcUrlToHttp(url)!}))

    for (const room of rooms) {
      const x= getAvatarUrl(client, room.roomId, "room");
      console.log(x, room.roomId);
    }

    setAvatarsReady({"rooms": true});
  }, [])

  useEffect(() => {
    if (currentRoom && avatarsReady) {
      const avatarsToLoad =
        roomEvents[currentRoom.roomId]?.reduce((init, e) => {
          const sender = e.event.getSender();
          return sender
            ? init.indexOf(sender)
              ? init
              : [...init, sender]
            : init;
        }, [] as string[]) ?? [];

      for (const user of avatarsToLoad) {
        getAvatarUrl(client, user, "user");
      }

      setAvatarsReady((prev) => ({
        ...prev,
        [currentRoom.roomId]: true,
      }));
    }
  }, [currentRoom]);

  return (
    <AvatarContext.Provider
      value={{
        avatars: avatarsMemo,
        setAvatars,
        avatarsReady: avatarsReady ? currentRoom ? avatarsReady[currentRoom!.roomId]! : avatarsReady["rooms"]! : null,
      }}
    >
      {props.children}
    </AvatarContext.Provider>
  );
};

export default AvatarProvider;
