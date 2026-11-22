import { useEffect, useState } from "react";
import { Logo } from "./components/ui";
import type { StringKey } from "./lib/i18n";
import { About } from "./screens/About";
import { Check } from "./screens/Check";
import { Find } from "./screens/Find";
import { Fit } from "./screens/Fit";
import { Fresh } from "./screens/Fresh";
import { Looks } from "./screens/Looks";
import { Onboarding } from "./screens/Onboarding";
import { Settings } from "./screens/Settings";
import { Style } from "./screens/Style";
import { useApp } from "./state";

const TABS: { id: string; label: StringKey; View: () => JSX.Element }[] = [
  { id: "fit", label: "tabFit", View: Fit },
  { id: "style", label: "tabStyle", View: Style },
  { id: "looks", label: "tabLooks", View: Looks },
  { id: "find", label: "tabFind", View: Find },
  { id: "fresh", label: "tabFresh", View: Fresh },
  { id: "check", label: "tabCheck", View: Check },
];
const EXTRA: Record<string, () => JSX.Element> = { settings: Settings, about: About };

function useHash(): string {
  const [h, setH] = useState(() => location.hash.slice(1));
  useEffect(() => {
    const on = () => setH(location.hash.slice(1));
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return h;
}

const HINT_KEY = "closet-scout:install-hint-dismissed";
const hintDismissed = () => { try { return localStorage.getItem(HINT_KEY) === "1"; } catch { return false; } };
const isIosSafari = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(navigator as Navigator & { standalone?: boolean }).standalone && !hintDismissed();

export function App() {
  const { profile, t, apiKey } = useApp();
  const hash = useHash();
  const [installHint, setInstallHint] = useState(() => isIosSafari());

  const tab = TABS.find((x) => x.id === hash);
  const View = tab?.View ?? EXTRA[hash] ?? Fit;
  const current = tab?.id ?? (EXTRA[hash] ? hash : "fit");

  useEffect(() => {
    document.querySelector(`[data-tab="${current}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    window.scrollTo({ top: 0 });
  }, [current]);

  if (!profile.onboarded) return <Onboarding />;

  return (
    <div className="shell">
      <header className="top">
        <a href="#fit" className="home" aria-label="Closet Scout"><Logo small /></a>
        <nav className="meta" aria-label={t("settings")}>
          <a href="#settings" aria-current={current === "settings" ? "page" : undefined}>{t("settings")}</a>
          <a href="#about" aria-current={current === "about" ? "page" : undefined}>{t("about")}</a>
        </nav>
      </header>
      <nav className="tabs" aria-label="Sections">
        {TABS.map((x) => (
          <a key={x.id} href={`#${x.id}`} data-tab={x.id} aria-current={current === x.id ? "page" : undefined}>{t(x.label)}</a>
        ))}
      </nav>
      <main className="content">
        {!apiKey && current !== "settings" && current !== "about" && (
          <p className="cs-note"><a href="#settings">{t("err_no_key")}</a></p>
        )}
        {installHint && (
          <p className="cs-note install">
            {t("installIos")}{" "}
            <button type="button" className="cs-btn cs-btn-text" aria-label="Close" onClick={() => { setInstallHint(false); try { localStorage.setItem(HINT_KEY, "1"); } catch { /* private mode */ } }}>×</button>
          </p>
        )}
        <View />
        <footer className="foot cs-hint">{t("notAffiliated")} · <a href="#about">{t("about")}</a></footer>
      </main>
    </div>
  );
}
