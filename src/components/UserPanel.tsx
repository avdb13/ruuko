import {
  ChangeEvent,
  ReactNode, useContext,
  useRef,
  useState
} from "react";
import { ClientContext } from "../providers/client";
import countries from "../../data/countries.json";
import Avatar from "./Avatar";
import Gear from "./icons/Gear";
import Modal, { Input } from "./Modal";
import Exit from "./icons/Exit";
import Pencil from "./icons/Pencil";
import { SettingsContext } from "../providers/settings";
import { getFlagEmoji } from "../lib/helpers";
import PasswordIcon from "./icons/Password";
import KeyIcon from "./icons/Key";

const DevicesTab = () => {
  return <div></div>;
};
const AppearanceTab = () => {
  return <div></div>;
};
const ContentTab = () => {
  return <div></div>;
};
const NotificationsTab = () => {
  return <div></div>;
};
const AboutTab = () => {
  return <div></div>;
};

type backupMethod = "recoveryKey" | "password";

const PrivacyTab = () => {
  const [backupMethod, setBackupMethod] = useState<backupMethod | null>(null);
  const [backupInputVisibility, setbackupInputVisibility] = useState(false);
  const backupRef = useRef<HTMLInputElement>(null);
  const client = useContext(ClientContext);
  client.restoreKeyBackupWithSecretStorage;

  const generateBackupKey = () => {
    client.getDeviceEd25519Key();
    setbackupInputVisibility(true);

    if (backupMethod === "password") {
      client.keyBackupKeyFromPassword(backupRef.current?.value);
      client.sendKeyBackup;
    } else {
      client.keyBackupKeyFromRecoveryKey();
    }
  };

  return (
    <div className="flex grow border-2 gap-2">
      <div>
        <p className="uppercase font-bold text-xs">encryption</p>
        <div className="grid gap-2 grid-cols-2 group">
          <label className="flex col-span-1 justify-center border-2 p-2 rounded-md peer-checked:text-red-100">
            <PasswordIcon />
            <input
              className="invisible peer"
              type="radio"
              name="radio"
              onClick={() => {
                setBackupMethod("password");
              }}
            />
            <span>password</span>
          </label>
          <label className="flex col-span-1 justify-center border-2 p-2 rounded-md peer-checked:text-red-100">
            <KeyIcon />
            <input
              className="invisible peer"
              type="radio"
              name="radio"
              onClick={() => {
                setBackupMethod("recoveryKey");
              }}
            />
            <span>recovery key</span>
          </label>
          <button
            className="col-span-2 pointer-events-none [.group:has(:checked)_&]:pointer-events-auto [.group:has(:checked)_&]:bg-indigo-200 bg-gray-200 rounded-md p-2"
            onClick={generateBackupKey}
          >
            reset backup
          </button>
          {backupInputVisibility ? (
            <input type="password" ref={backupRef} />
          ) : null}
        </div>
      </div>
    </div>
  );
};

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

    const resp = await client.requestAdd3pidEmailToken(
      newEmail,
      client.generateClientSecret(),
      1,
    );
    // TODO:
    setRequested(false);
  };

  return (
    <div className="flex grow gap-2">
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
            <p key={email}>{email}</p>
          ))}
          <form method="dialog" className="flex">
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-gray-100 h-6 invalid:bg-red-100"
            />
            <button className="bg-gray-300 w-6 h-6" onClick={addEmail}>
              +
            </button>
          </form>
          {requested ? <p>check your email</p> : null}
        </div>
        <div>
          <p className="uppercase font-bold text-xs">phone numbers</p>
          {settings.phoneNumbers.map((number) => (
            <p key={number}>{number}</p>
          ))}
          <div className="flex">
            <select onClick={(e) => console.log(e)}>
              {countries.map((c) => (
                <option key={c.code}>{getFlagEmoji(c.code) + " " + c.dial_code}</option>
              ))}
            </select>
            <Input
              type="text"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="bg-gray-100 h-6 invalid:bg-red-100"
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
  const inputRef = useRef<HTMLInputElement>(null);
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
        className="group-hover:scale-90 group-hover:blur-sm transition-all duration-300 ease-out"
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

const submenuComponents = [
  <AccountTab />,
  <PrivacyTab />,
  <DevicesTab />,
  <AppearanceTab />,
  <ContentTab />,
  <NotificationsTab />,
  <AboutTab />,
];

const submenusObj = submenus.reduce(
  (init, key, i) => ({ ...init, [key]: submenuComponents[i] }),
  {} as Record<Submenu, ReactNode>,
);

type SubmenusReadOnly = typeof submenus;
type Submenu = SubmenusReadOnly[number];

const UserPanel = () => {
  const client = useContext(ClientContext);
  const [visible, setVisible] = useState(false);

  const userId = client.getSafeUserId();
  const name = userId?.split(":")[0]?.substring(1)

  return (
    <div className="min-w-0 w-full flex justify-between basis-12 bg-opacity-50 bg-indigo-200 rounded-sm gap-2 p-2">
      <Settings visible={visible} setVisible={setVisible} />
      <Avatar id={userId!} type="user" size={16} />
      <div className="flex flex-col justify-center min-w-0 text-center">
        <p className="whitespace-nowrap truncate font-bold">
          {name}
        </p>
        <p className="whitespace-nowrap truncate">{userId!}</p>
      </div>
      <div className="flex content-center gap-2">
        <button onClick={() => client.logout(true)} title="logout">
    <Exit className="hover:animate-shake duration-300 " />
        </button>
        <button onClick={() => setVisible(!visible)} title="settings">
    <Gear className="hover:rotate-180 duration-500 hover:blur-2" />
        </button>
      </div>
    </div>
  );
};

const Settings = ({
  visible,
  setVisible,
}: {
  visible: boolean;
  setVisible: (_: boolean) => void;
}) => {
  const [selection, setSelection] = useState<Submenu>("Account");

  return (
    <Modal title="settings" visible={visible} setVisible={setVisible}>
      <div className="flex gap-2 m-4">
        <ul className="flex flex-col justify-self-start gap-2 basis-1/4 bg-gray-100">
          {submenus.map((menu) => (
            <button
              key={menu}
              onClick={() => setSelection(menu)}
              className="bg-gray-300 hover:bg-gray-400 duration-100 rounded-md text-center p-2"
            >
              {menu}
            </button>
          ))}
        </ul>
        {submenusObj[selection]}
      </div>
    </Modal>
  );
};

export default UserPanel;
