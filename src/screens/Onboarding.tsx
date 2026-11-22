import { useState } from "react";
import { ErrorText, Logo, SelectField, useAsk } from "../components/ui";
import { testKey } from "../lib/claude";
import type { Lang } from "../lib/store";
import { useApp } from "../state";

export function Onboarding() {
  const { profile: p, update, t, setApiKey } = useApp();
  const [key, setKey] = useState("");
  const a = useAsk();

  return (
    <main className="onboarding">
      <Logo />
      <h1>{t("obHeadline")}</h1>
      <p className="lead">{t("obLead")}</p>
      <p className="cs-note">{t("obPrivacy")}</p>

      <SelectField<Lang> label={t("obLanguage")} value={p.lang}
        options={[{ value: "en", label: "English" }, { value: "es", label: "Español" }]} onChange={(lang) => update({ lang })} />

      <section className="cs-stack">
        <h2>{t("obKeyTitle")}</h2>
        <p className="cs-hint">{t("obKeyHow")}</p>
        <label className="cs-field">
          {t("obKeyLabel")}
          <input type="password" autoComplete="off" value={key} placeholder="sk-ant-…" onChange={(e) => setKey(e.target.value)} />
        </label>
        <ErrorText error={a.error} />
        <div className="cs-row">
          <button type="button" className="cs-btn cs-btn-primary" disabled={a.busy || !key.trim()}
            onClick={() => a.run(async () => {
              await testKey(key);
              await setApiKey(key);
              update({ onboarded: true });
              location.hash = "#fit";
            })}>
            {a.busy ? t("thinking") : t("obStart")}
          </button>
          <button type="button" className="cs-btn cs-btn-text" onClick={() => { update({ onboarded: true }); location.hash = "#fit"; }}>{t("obSkip")}</button>
        </div>
      </section>
      <p className="cs-hint">{t("notAffiliated")}</p>
    </main>
  );
}
