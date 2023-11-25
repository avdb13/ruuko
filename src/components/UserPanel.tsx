import { useContext } from "react";
import { ClientContext } from "../providers/client";
import Avatar from "./Avatar";

const UserPanel = () => {
  const client = useContext(ClientContext);
  const userId = client.getUserId();

  return (
    <div className="flex h-[300px] bg-cyan-100">
      <Avatar id={userId!} type="user" size={16} />
    </div>
  )
}

export default UserPanel;
