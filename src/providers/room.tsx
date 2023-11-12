import { Room } from "matrix-js-sdk";
import { PropsWithChildren, createContext, useState } from "react";

export const RoomContext = createContext<{currentRoom: Room | null, setCurrentRoom: (_: Room) => void} | null>(null);

const RoomProvider = (props: PropsWithChildren) => {
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  return (
    <RoomContext.Provider value={{ currentRoom, setCurrentRoom }}>
      {props.children}
    </RoomContext.Provider>
  );

};

export default RoomProvider;
