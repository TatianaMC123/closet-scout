import { useRef, useState } from "react";
import { AskButton, ErrorText, Panel, SelectField, useAsk } from "../components/ui";
import { MODELS, testKey } from "../lib/claude";
import { blankProfile, deleteEverything, exportProfile, importProfile, type Lang, type ModelId } from "../lib/store";
import { describeFilters, DOMAINS, parseCalibration, type SizeGroup, type VintedSettings } from "../lib/vinted";
import { useApp } from "../state";

export function Settings() {
  const { profile: p, update, replace, t, lang, apiKey, setApiKey } = useApp();
  const test = useAsk();
  const [keyText, setKeyText] = useState("");
  const [keyOk, setKeyOk] = useState(false);
  const [cal, setCal] = useState<Record<string, string>>({});
  const [calMsg, setCalMsg] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const saveCal = (g: SizeGroup, value: string) => {
    if (!value.trim()) return;
    const r = parseCalibration(value);
    if ("error" in r) { setCalMsg(r.error === "not_vinted" ? t("calNotVinted") : t("calNotUrl")); return; }
    setCalMsg("");
    update({ vinted: { ...p.vinted, domain: DOMAINS.includes(r.domain) ? r.domain : p.vinted.domain, filters: { ...p.vinted.filters, [g]: r.params } } });
    setCal((c) => ({ ...c, [g]: "" }));
  };

  const download = () => {
    const blob = new Blob([exportProfile(p)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `closet-scout-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const groups: { g: SizeGroup; label: string }[] = [
    { g: "clothing", label: t("calClothing") }, { g: "trousers", label: t("calTrousers") }, { g: "shoes", label: t("calShoes") },
  ];
  const savedGroups = groups.filter(({ g }) => p.vinted.filters[g]);

  return (
    <>
      <Panel title={t("keyTitle")} hint={apiKey ? t("keySet") : t("keyNotSet")}>
        <div className="cs-row nowrap">
          <input className="grow" type="password" autoComplete="off" value={keyText} placeholder="sk-ant-…" aria-label={t("keyTitle")}
            onChange={(e) => { setKeyText(e.target.value); setKeyOk(false); }} />
          <button type="button" className="cs-btn cs-btn-primary" disabled={!keyText.trim()} onClick={async () => { await setApiKey(keyText); setKeyText(""); }}>{t("keySave")}</button>
        </div>
        <div className="cs-row">
          <AskButton primary={false} label={t("keyTest")} busy={test.busy} onStop={test.stop} disabled={!apiKey && !keyText.trim()}
            onClick={() => test.run(async () => { setKeyOk(false); await testKey(keyText.trim() || apiKey || ""); setKeyOk(true); })} />
          {apiKey && <button type="button" className="cs-btn cs-btn-text" onClick={() => { void setApiKey(null); setKeyOk(false); }}>{t("keyRemove")}</button>}
          {keyOk && <span className="cs-saved" role="status">✓ {t("keyOk")}</span>}
        </div>
        <ErrorText error={test.error} />
      </Panel>

      <Panel title={t("modelTitle")}>
        <SelectField<ModelId> label={t("modelTitle")} value={p.model} options={MODELS.map((m) => ({ value: m.id, label: m[lang] }))} onChange={(model) => update({ model })} />
        <SelectField<Lang> label="Language / Idioma" value={p.lang} options={[{ value: "en", label: "English" }, { value: "es", label: "Español" }]} onChange={(l) => update({ lang: l })} />
      </Panel>

      <Panel title={t("vintedTitle")}>
        <div className="grid">
          <SelectField label={t("vintedSite")} value={p.vinted.domain} options={DOMAINS.map((d) => ({ value: d, label: d }))}
            onChange={(domain) => update({ vinted: { ...p.vinted, domain } })} />
          <SelectField<VintedSettings["order"]> label={t("sortBy")} value={p.vinted.order}
            options={[{ value: "newest_first", label: t("sortNewest") }, { value: "relevance", label: t("sortRelevance") }, { value: "price_low_to_high", label: t("sortPrice") }]}
            onChange={(order) => update({ vinted: { ...p.vinted, order } })} />
        </div>
        <h3 className="sub">{t("calTitle")}</h3>
        <p className="cs-hint">{t("calHint")}</p>
        <div className="grid wide">
          {groups.map(({ g, label }) => (
            <label className="cs-field" key={g}>
              {label}
              <input value={cal[g] ?? ""} placeholder={p.vinted.filters[g] ? `${t("calSaved")}: ${describeFilters(p.vinted.filters[g]!)}` : `https://www.${p.vinted.domain}/catalog?…`}
                onChange={(e) => setCal((c) => ({ ...c, [g]: e.target.value }))} onBlur={(e) => saveCal(g, e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveCal(g, (e.target as HTMLInputElement).value); }} />
            </label>
          ))}
        </div>
        {calMsg && <p className="cs-error" role="alert">{calMsg}</p>}
        <p className="cs-hint">
          {savedGroups.length === 0 ? t("calNone") : `${t("calSaved")}: `}
          {savedGroups.map(({ g, label }) => (
            <span key={g}>
              <b>{label}</b> ({describeFilters(p.vinted.filters[g]!)}){" "}
              <button type="button" className="cs-btn cs-btn-text" onClick={() => update({ vinted: { ...p.vinted, filters: { ...p.vinted.filters, [g]: "" } } })}>{t("remove")}</button>{" "}
            </span>
          ))}
        </p>
      </Panel>

      <Panel title={t("backupTitle")} hint={t("backupHint")}>
        <div className="cs-row">
          <button type="button" className="cs-btn" onClick={download}>{t("exportBtn")}</button>
          <button type="button" className="cs-btn" onClick={() => fileRef.current?.click()}>{t("importBtn")}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            try { replace(importProfile(await f.text())); setMsg(t("importOk")); } catch { setMsg(t("importBad")); }
          }} />
          {msg && <span className="cs-hint" role="status">{msg}</span>}
        </div>
      </Panel>

      <Panel title={t("deleteTitle")} hint={t("deleteHint")}>
        {confirmDelete ? (
          <div className="cs-row">
            <button type="button" className="cs-btn danger" onClick={async () => { await deleteEverything(); await setApiKey(null); replace(blankProfile(lang)); location.hash = ""; }}>{t("deleteConfirm")}</button>
            <button type="button" className="cs-btn" onClick={() => setConfirmDelete(false)}>{t("cancel")}</button>
          </div>
        ) : (
          <div className="cs-row"><button type="button" className="cs-btn" onClick={() => setConfirmDelete(true)}>{t("deleteTitle")}</button></div>
        )}
      </Panel>
    </>
  );
}
