import { useContext, useState } from "react";
import { ClientContext } from "../providers/client";

const InputBar = ({ roomId }: {roomId: string}) => {
  const client = useContext(ClientContext);
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    client.sendTextMessage(roomId, message);
  };

  return (
    <form
      onSubmit={handleSubmit}
    >
      <input
        className="sticky basis-12 p-4 h-[100vh] bg-slate-500"
        id="input-panel"
        onChange={(e) => setMessage(e.target.value)}
      />
    </form>
  );
};

export default InputBar;
