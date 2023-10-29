import { Room } from "matrix-js-sdk";
import { useContext, useEffect, useState } from "react";
import { ClientContext } from "../providers/client";

const Sidebar = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const { client } = useContext(ClientContext)!;

  useEffect(() => {
    if (client) {
      const rooms = client.getRooms();
      setRooms(rooms!);
    }
  }, [client])

  if (rooms.length < 0) {
    return <div>loading...</div>
  }

  return (
    <div className="flex basis-48 bg-slate-400 justify-center">
      <div className="flex flex-col h-screen ">
        <div className="">
          <p>direct messages</p>
          <ul>
          </ul>
        </div>
        <div>
          <p>rooms</p>
          <ul>
            {rooms.map(room => (<li><img src={room.getAvatarUrl(client!.baseUrl, 24, 24, "scale")!} /><h1>{room.name}</h1></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
};

export default Sidebar;
