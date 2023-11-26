import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";
import { ClientContext } from "./client";
import { ThreepidMedium } from "matrix-js-sdk";

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


export const SettingsContext = createContext<{settings: Settings, setSettings: (_: Settings) => void} | null>(null);

const SettingsProvider = (props: PropsWithChildren) => {
  const client = useContext(ClientContext);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const getPhoneNumbers = async () => {
    const { threepids } = await client.getThreePids();
    console.log(threepids);
    return threepids.filter(t => t.medium === ThreepidMedium.Phone).map(t => t.address);
  };

  const getEmails = async () => {
    const { threepids } = await client.getThreePids();
    return threepids.filter(t => t.medium === ThreepidMedium.Email).map(t => t.address);
  };

  useEffect(() => {
    console.log("before useEffect");
    async () => {
      console.log("during useEffect");
      const emails = await getEmails();
      const phoneNumbers = await getPhoneNumbers();

      setSettings({ ...settings, emails, phoneNumbers })
    };
    console.log("after useEffect");
  }, [])

  return (
    <SettingsContext.Provider value={{settings, setSettings}}>
      {props.children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
