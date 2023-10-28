import { useContext, useEffect, useState } from "react";
import { ClientContext } from "./providers/client";
import { Room } from "matrix-js-sdk";

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

  if (!rooms) {
    return <div>loading...</div>
  }

  return (
    <div>
      <ul>
        {rooms.map(room => <li>{room.name}</li>)}
      </ul>
    </div>
  )
};

export default Home;
