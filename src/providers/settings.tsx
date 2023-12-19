import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { ClientContext } from "./client";
import { ThreepidMedium } from "matrix-js-sdk";
import "dotenv";

interface Settings {
  emails: string[];
  phoneNumbers: string[];
  showJoinLeaveMessages: boolean;
  onlineStatus: boolean;
}

const defaultSettings = {
  emails: [],
  phoneNumbers: [],
  showJoinLeaveMessages: true,
  onlineStatus: true,
};

type ContextProps = {
  settings: Settings;
  setSettings: (_: Settings) => void;
  setRefreshPids: (_: boolean) => void;
} | null;

export const SettingsContext = createContext<ContextProps>(null);

const SettingsProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [refreshPids, setRefreshPids] = useState(false);

  const getPhoneNumbers = async () => {
    const { threepids } = await client.getThreePids();
    return threepids
      .filter((t) => t.medium === ThreepidMedium.Phone)
      .map((t) => t.address);
  };

  const getEmails = async () => {
    const { threepids } = await client.getThreePids();
    console.log(threepids);
    return threepids
      .filter((t) => t.medium === ThreepidMedium.Email)
      .map((t) => t.address);
  };

  useEffect(() => {
    getEmails().then((emails) => {
      setSettings((prevSettings) => ({ ...prevSettings, emails }));
    });
    getPhoneNumbers().then((phoneNumbers) => {
      setSettings((prevSettings) => ({ ...prevSettings, phoneNumbers }));
    });
  }, [refreshPids]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, setRefreshPids }}>
      {props.children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
