import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAppSettings } from "../lib/api";

const EmojiCtx = createContext({});

export function EmojiProvider({ children }) {
  const [settings, setSettings] = useState({});

  const reload = useCallback(() => {
    getAppSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => { reload(); }, []);

  return (
    <EmojiCtx.Provider value={{ ...settings, reloadEmojis: reload }}>
      {children}
    </EmojiCtx.Provider>
  );
}

export function useEmojis() {
  return useContext(EmojiCtx);
}
