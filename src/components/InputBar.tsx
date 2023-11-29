import { SyntheticEvent, useContext, useState } from "react";
import { ClientContext } from "../providers/client";
const InputBar = ({ roomId }: {roomId: string }) => {
  const client = useContext(ClientContext);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();

    client.sendTextMessage(roomId, message);
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 sticky h-12 ml-2"
    >
      <button className="basis-8 bg-black rounded-md my-2">
      </button>
      <input
        id="input-panel"
        className="flex bg-green-200 grow p-1 rounded-md my-2"
        placeholder={`Message ${client.getRoom(roomId)?.name}`}
        onChange={(e) => setMessage(e.target.value)}
        value={message}
      />
      <button type="submit" style={{visibility: "hidden"}}></button>
    </form>
  );
};

export default InputBar;
