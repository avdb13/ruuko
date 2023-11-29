import { useContext, useState, useEffect } from "react";
import { ClientContext } from "../providers/client";
import { RoomContext } from "../providers/room";
import { DirectAvatar } from "./Avatar";
import { Room } from "matrix-js-sdk";

const SearchForm = ({
  search,
  joinRoom,
}: {
  search: (_: string) => Promise<Metadata[]>;
  joinRoom: (_: string) => Promise<Room>;
}) => {
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<Metadata[] | null>(null);

  useEffect(() => {
    if (term.length > 0) {
      search(term).then((resp) => setResult(resp));
    }
  }, [term]);

  return (
    <>
      <div className="flex items-center m-4 w-[80%]">
        <input
          placeholder="room"
          className="border-2 basis-full p-4 mx-4 max-h-[40px] flex-1 focus:border-2"
          type="text"
          onChange={(e) => setTerm(e.target.value)}
        />
        <button className="rounded-md bg-zinc-100 p-[10px]">🔍</button>
      </div>
      {term.length > 0 ? (
        <ul className="flex flex-col w-[80%] border-2">
          {result
            ? result.map((metadata) => (
                <SearchResult metadata={metadata} joinRoom={joinRoom} />
              ))
            : null}
        </ul>
      ) : null}
    </>
  );
};

const SearchUserForm = () => {
  const client = useContext(ClientContext);

  const search = (term: string) =>
    client
      .searchUserDirectory({ term })
      .then((resp) =>
        resp.results.map((resp) => ({
          avatar_url: resp.avatar_url,
          id: resp.user_id,
          name: resp.display_name,
        })),
      );

  const joinRoom = (id: string) => {
    return client
      .createRoom({ is_direct: true, invite: [id] })
      .then(({ room_id }) =>
          client.getRooms().find((room) => room.roomId === room_id)!,
      );
  };

  return <SearchForm search={search} joinRoom={joinRoom} />;
};

const SearchRoomForm = () => {
  const client = useContext(ClientContext);

  const search = (term: string) =>
    client
      .publicRooms({
        // server: "https://matrix.org",
        limit: 50,
        filter: { generic_search_term: term },
      })
      .then((resp) =>
        resp.chunk.map((resp) => ({
          avatar_url: resp.avatar_url,
          id: resp.room_id,
          name: resp.name,
          topic: resp.topic,
        })),
      );

  const joinRoom = (id: string) => {
    return client
      .joinRoom(id)
      .then(({ roomId }) =>
          client.getRooms().find((room) => room.roomId === roomId)!,
      );
  };

  return <SearchForm search={search} joinRoom={joinRoom} />;
};

const SearchResult = ({
  metadata,
  joinRoom,
}: {
  metadata: Metadata;
  joinRoom: (_: string) => Promise<Room>;
}) => {
  const { setCurrentRoom } = useContext(RoomContext)!;

  return (
    <button
      className="flex border-2 p-2 items-center gap-2"
      key={metadata.id}
      onClick={() => joinRoom(metadata.id).then(r => setCurrentRoom(r))}
    >
      <DirectAvatar url={metadata.avatar_url} size={8} />
      <div className="flex flex-col min-w-0 items-start">
        <p className="px-1">{metadata.name}</p>
        {metadata.topic ? (
          <p className="text-zinc-500 truncate max-w-full">{metadata.topic}</p>
        ) : null}
      </div>
    </button>
  );
};

export { SearchUserForm, SearchRoomForm };
