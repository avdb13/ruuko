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
      className="sticky basis-8 shrink-0 p-4 h-[100vh] bg-slate-500"
    >
      <input
        id="input-panel"
        className="flex bg-slate-300 basis-8 w-[100vh]"
        onChange={(e) => setMessage(e.target.value)}
        value={message}
      />
      <button type="submit" style={{visibility: "hidden"}}></button>
    </form>
  );
};

export default InputBar;
