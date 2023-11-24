import { PropsWithChildren, createContext, useState } from "react";

interface Settings {
  showJoinLeaveMessages: boolean;
}

const defaultSettings = {
  showJoinLeaveMessages: true,
};


export const SettingsContext = createContext<{settings: Settings, setSettings: (_: Settings) => void} | null>(null);

const SettingsProvider = (props: PropsWithChildren) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  return (
    <SettingsContext.Provider value={{settings, setSettings}}>
      {props.children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
