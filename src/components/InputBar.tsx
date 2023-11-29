import { SyntheticEvent, useContext, useState } from "react";
import { ClientContext } from "../providers/client";
import FileIcon from "./icons/File";
const InputBar = ({ roomId }: {roomId: string }) => {
  const client = useContext(ClientContext);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: SyntheticEvent) => {
    e.preventDefault();

    client.sendImageMessage();
    client.sendTextMessage(roomId, message);
    setMessage("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex gap-2 sticky h-12 ml-2"
    >
      <input className="basis-8 rounded-md my-2 opacity-0" type="file" />
      <FileIcon className="basis-8 w-8 h-8 my-2 absolute rounded-md border-2" />
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
