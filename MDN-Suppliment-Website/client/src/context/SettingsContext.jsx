import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/api";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  // Defaults to true so the effect still shows up before the fetch
  // resolves — the admin toggle only needs to win once data arrives.
  const [settings, setSettings] = useState({ splashCursorEnabled: true });

  const refreshSettings = () => {
    api
      .getSettings()
      .then((d) => setSettings(d.data))
      .catch(() => {}); // non-critical — keep the last-known/default value
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ ...settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
