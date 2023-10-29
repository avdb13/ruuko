import { useContext, useEffect, useState } from "react";
import { ClientContext } from "./providers/client";
import { Direction, Room } from "matrix-js-sdk";

const Home = () => {
  const { client } = useContext(ClientContext)!;
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    console.log(client);
    if (client) {
      const rooms = client.getRooms();
      setRooms(rooms!);
      console.log(rooms);

      client.startClient({ initialSyncLimit: 10 });
    }
  }, [client])

  if (rooms.length < 0) {
    return <div>loading...</div>
  }

  // <p>{room.getLiveTimeline().getState(Direction.Forward)?.getMembers()!}</p>
  return (
    <div>
      <ul>
        {rooms.map(room => (<li><img src={room.getAvatarUrl(client!.baseUrl, 24, 24, "scale")!} /><h1>{room.name}</h1></li>
        ))}
      </ul>
    </div>
  )
};

export default Home;
