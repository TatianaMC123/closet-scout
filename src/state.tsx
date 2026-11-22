import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { translate, type StringKey } from "./lib/i18n";
import { blankProfile, loadApiKey, loadProfile, removeApiKey, saveApiKey, saveProfile, type Lang, type Profile } from "./lib/store";

interface AppState {
  profile: Profile;
  update: (patch: Partial<Profile> | ((p: Profile) => Partial<Profile>)) => void;
  replace: (p: Profile) => void;
  apiKey: string | undefined;
  setApiKey: (key: string | null) => Promise<void>;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
  lang: Lang;
}

const Ctx = createContext<AppState | null>(null);

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside provider");
  return v;
}

function guessLang(): Lang {
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [apiKey, setKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    Promise.all([loadProfile(), loadApiKey()])
      .then(([p, k]) => {
        setProfile(p ?? blankProfile(guessLang()));
        setKey(k);
      })
      .catch(() => setProfile(blankProfile(guessLang())));
  }, []);

  // Save every change straight away. Writes run one at a time; if changes arrive while
  // a write is in progress, only the newest is written next. The profile is small.
  const saving = useRef(false);
  const pending = useRef<Profile | null>(null);
  const loaded = useRef(false);
  useEffect(() => {
    if (!profile) return;
    document.documentElement.lang = profile.lang;
    if (!loaded.current) { loaded.current = true; return; } // the value just read needs no write
    pending.current = profile;
    if (saving.current) return;
    saving.current = true;
    void (async () => {
      while (pending.current) {
        const next = pending.current;
        pending.current = null;
        await saveProfile(next).catch((e) => console.warn("Closet Scout could not save:", e));
      }
      saving.current = false;
    })();
  }, [profile]);

  const update = useCallback<AppState["update"]>((patch) => {
    setProfile((p) => (p ? { ...p, ...(typeof patch === "function" ? patch(p) : patch) } : p));
  }, []);

  const setApiKey = useCallback(async (key: string | null) => {
    if (key && key.trim()) {
      await saveApiKey(key);
      setKey(key.trim());
    } else {
      await removeApiKey();
      setKey(undefined);
    }
  }, []);

  const value = useMemo<AppState | null>(() => {
    if (!profile) return null;
    const lang = profile.lang;
    return {
      profile, update, replace: setProfile, apiKey, setApiKey, lang,
      t: (key, vars) => translate(lang, key, vars),
    };
  }, [profile, update, apiKey, setApiKey]);

  if (!value) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
