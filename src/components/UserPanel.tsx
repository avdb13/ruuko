import { Ref, useContext, useRef } from "react";
import { ClientContext } from "../providers/client";
import Avatar from "./Avatar";
import Gear from "./icons/Gear";
import Modal from "./Modal";
import Exit from "./icons/Exit";

const AccountTab = () => {
  const client = useContext(ClientContext);

  return (
    <div>
      <Avatar id={client.getUserId()!} size={24} type="user" />
    </div>
  )
}

const submenus = [
            "Account",
            "Privacy",
            "Devices",
            "Appearance",
            "Content",
            "Notifications",
            "About",
          ] as const;

type SubmenusReadOnly = typeof submenus;
type Submenus = SubmenusReadOnly[number];

const UserPanel = () => {
  const client = useContext(ClientContext);
  const userId = client.getUserId();
  const modalRef = useRef<ModalProps>(null);

  return (
    <div className="flex justify-between h-[300px] bg-cyan-100 gap-2 p-2">
      <Settings modalRef={modalRef} />
      <Avatar id={userId!} type="user" size={16} />
      <div className="flex flex-col justify-center min-w-0">
        <p className="whitespace-nowrap truncate font-bold">{client.getUser(userId!)?.displayName}</p>
        <p className="whitespace-nowrap truncate">{userId!}</p>
      </div>
      <div className="flex content-center gap-2">
        <button onClick={() => client.logout(true)}>
          <Exit />
        </button>
        <button onClick={() => modalRef.current?.toggleVisibility()}>
          <Gear />
        </button>
      </div>
    </div>
  );
};


const Settings = ({ modalRef }: { modalRef: Ref<ModalProps> }) => {
  return (
    <Modal title="settings" ref={modalRef}>
      <div className="flex justify-between">
        <ul className="flex flex-col gap-2 basis-1/2 grow bg-gray-100">
          {submenus.map((menu) => (
            <button onClick={() => {}} className="bg-gray-300 text-center p-2">{menu}</button>
          ))}
        </ul>
        <div className="basis-1/2 grow"></div>
      </div>
    </Modal>
  );
};

export default UserPanel;
