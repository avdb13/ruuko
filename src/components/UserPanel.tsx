import { ChangeEvent, Ref, useContext, useRef, useState } from "react";
import { ClientContext } from "../providers/client";
import countries from "../../data/countries.json";
import Avatar from "./Avatar";
import Gear from "./icons/Gear";
import Modal from "./Modal";
import Exit from "./icons/Exit";
import Pencil from "./icons/Pencil";
import { SettingsContext } from "../providers/settings";
import { ModalSelect, ModalInput } from "./ModalElements";
import { getFlagEmoji } from "../lib/helpers";

const PrivacyTab = () => {
  const client = useContext(ClientContext);

  return (
    <div className="flex grow border-2 gap-2">
    </div>
  );
}

const AccountTab = () => {
  const client = useContext(ClientContext);
  const { settings, setSettings } = useContext(SettingsContext)!;

  const [newNumber, setNewNumber] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [requested, setRequested] = useState(false);

  const user = client.getUser(client.getUserId()!)!;

  const addEmail = async () => {
    setNewEmail("");
    setRequested(true);


    const resp = await client.requestAdd3pidEmailToken(newEmail, client.generateClientSecret(), 1);
    // TODO:
    setRequested(false);
  }

  return (
    <div className="flex grow border-2 gap-2">
      <EditableAvatar />
      <div className="flex flex-col gap-2">
        <div>
          <p className="uppercase font-bold text-xs">display name</p>
          <p className="">{user.displayName!}</p>
        </div>
        <div>
          <p className="uppercase font-bold text-xs">username</p>
          <p className="">{user.userId}</p>
        </div>
        <div>
          <p className="uppercase font-bold text-xs">email addresses</p>
          {settings.emails.map((email) => (
            <p>{email}</p>
          ))}
          <div className="flex">
            <ModalInput
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-gray-100 h-6 focus:outline-none invalid:bg-red-100"
            />
            <button className="bg-gray-300 w-6 h-6" onClick={addEmail}>
              +
            </button>
          </div>
          {requested ? <p>check your email</p> : null}
        </div>
        <div>
          <p className="uppercase font-bold text-xs">phone numbers</p>
          {settings.phoneNumbers.map((number) => (
            <p>{number}</p>
          ))}
          <div className="flex">
            <ModalSelect options={countries.map(c => getFlagEmoji(c.code) + " " + c.dial_code)} />
            <ModalInput
              type="text"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="bg-gray-100 h-6 focus:outline-none invalid:bg-red-100"
            />
            <button className="bg-gray-300 w-6 h-6" onClick={addEmail}>
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditableAvatar = () => {
  const client = useContext(ClientContext);
  const inputRef = useRef<HTMLInputElement>();
  const [avatar, setAvatar] = useState<File | null>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) =>
    e.target.files && e.target.files.length > 0
      ? setAvatar(e.target.files[0]!)
      : null;

  const onSubmit = async () => {
    if (avatar) {
      console.log("file found");
      const resp = await client.uploadContent(avatar);
      try {
        client.setAvatarUrl(resp.content_uri);
      } catch (e) {
        console.log(e);
      }
    }
  };

  return (
    <div className="group relative shrink">
      <Avatar
        id={client.getUserId()!}
        size={24}
        type="user"
        className="z-1 group-hover:scale-90 group-hover:blur-sm transition-all duration-300 ease-out"
      />
      <div
        className="opacity-0 group-hover:opacity-50 absolute -top-0 rounded-full w-24 h-24 transition-all duration-300 ease-out"
        style={{
          backgroundImage:
            "radial-gradient(rgb(0 0 0 / 20%), rgb(0 0 0 / 40%), rgb(0 0 0 / 80%), rgb(0 0 0 / 20%), rgb(0 0 0 / 0))",
        }}
      ></div>
      <div className="absolute w-24 h-24 -top-0 flex justify-center items-center rounded-full border-4">
        <Pencil className="invert opacity-0 group-hover:opacity-100 group-hover:scale-125 group-hover:transition-all duration-300 ease-out" />
      </div>
      <input
        className="absolute w-24 h-24 -top-0 opacity-0"
        type="file"
        onChange={(e) => onChange(e) && inputRef.current?.form?.submit()}
        onSubmit={onSubmit}
        ref={inputRef}
      />
    </div>
  );
};

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
  const modalRef = useRef<ModalProps>(null);

  const userId = client.getUserId();

  return (
    <div className="flex justify-between h-[300px] bg-cyan-100 gap-2 p-2">
      <Settings modalRef={modalRef} />
      <Avatar id={userId!} type="user" size={16} />
      <div className="flex flex-col justify-center min-w-0">
        <p className="whitespace-nowrap truncate font-bold">
          {client.getUser(userId!)?.displayName}
        </p>
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
  const [selection, setSelection] = useState<Submenus>("Account");

  return (
    <Modal title="settings" ref={modalRef} className="flex gap-2">
      <ul className="flex flex-col justify-self-start gap-2 basis-1/4 bg-gray-100">
        {submenus.map((menu) => (
          <button
            onClick={() => setSelection(menu)}
            className="bg-gray-300 hover:bg-gray-400 duration-100 rounded-md text-center p-2"
          >
            {menu}
          </button>
        ))}
      </ul>
      <div className="flex-1 basis-3/4 grow">
        <AccountTab />
      </div>
    </Modal>
  );
};

export default UserPanel;
