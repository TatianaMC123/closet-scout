import { useState } from "react";
import { clearPicked, ImagePicker, type Picked } from "../components/ImagePicker";
import { AskButton, ErrorText, Panel, TextField, useAsk } from "../components/ui";
import { ask, ClaudeError } from "../lib/claude";
import { prepareImage } from "../lib/images";
import { checkPrompt } from "../lib/prompts";
import { VerdictSchema, type Verdict } from "../lib/schemas";
import { newId } from "../lib/store";
import { useApp } from "../state";

const isVintedUrl = (u: string) => /^https:\/\/(www\.)?vinted\.[a-z.]+\//.test(u.trim());

export function Check() {
  const { profile: p, update, t, apiKey } = useApp();
  const a = useAsk();
  const [imgs, setImgs] = useState<Picked[]>([]);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [v, setV] = useState<Verdict | null>(null);
  const [copied, setCopied] = useState<string>("");
  const [added, setAdded] = useState(false);
  const word = v ? { buy: t("vBuy"), maybe: t("vMaybe"), skip: t("vSkip") }[v.verdict] : "";

  return (
    <>
      <Panel title={t("checkTitle")} hint={t("checkHint")}>
        <ImagePicker id="check-picker" images={imgs} onChange={setImgs} />
        <TextField label={t("checkText")} value={text} placeholder={t("checkTextPh")} multiline onChange={setText} />
        <TextField label={t("checkUrl")} value={link} placeholder="https://www.vinted.es/items/…" onChange={setLink} />
        <div className="cs-row">
          <AskButton label={t("checkBtn")} busy={a.busy} onStop={a.stop} disabled={!imgs.length && !text.trim()}
            onClick={() => a.run(async (signal) => {
              if (!imgs.length && !text.trim()) throw new ClaudeError("bad_request");
              const prepared = await Promise.all(imgs.map((i) => prepareImage(i.file)));
              const r = await ask({ apiKey, model: p.model, schema: VerdictSchema, prompt: checkPrompt(p, prepared.length > 0, text.trim()), images: prepared, signal });
              setV(r); setAdded(false); setCopied("");
            })} />
        </div>
        <ErrorText error={a.error} />

        {v && (
          <div className="verdict">
            <div className={`cs-verdict-word cs-verdict-${v.verdict}`}>{word}</div>
            <div className="cs-row">
              <span className="cs-score">{t("fit")} {v.fitScore}/10</span>
              <span className="cs-score">{t("style")} {v.styleScore}/10</span>
              <b>{v.title}</b>
            </div>
            <p><b>{t("fit")}.</b> {v.fit}</p>
            <p><b>{t("style")}.</b> {v.style}</p>
            <p><b>{t("price")}.</b> {v.price}</p>
            {v.goesWith.length > 0 && <p><b>{t("goesWith")}:</b> {v.goesWith.join(", ")}</p>}
            {v.watchOut.length > 0 && (
              <div className="cs-note"><b>{t("watchOut")}</b><ul className="clean">{v.watchOut.map((w) => <li key={w}>{w}</li>)}</ul></div>
            )}
            {v.askSeller.length > 0 && (
              <div className="cs-stack">
                <b>{t("askSeller")}</b>
                <ul className="clean selectable">{v.askSeller.map((q) => <li key={q}>{q}</li>)}</ul>
                <div className="cs-row">
                  <button type="button" className="cs-btn" onClick={() => {
                    navigator.clipboard?.writeText(v.askSeller.join("\n")).then(() => setCopied(t("copied")), () => setCopied(t("selectToCopy")));
                  }}>{t("copyQuestions")}</button>
                  {copied && <span className="cs-hint" role="status">{copied}</span>}
                </div>
              </div>
            )}
            <div className="cs-row">
              <button type="button" className="cs-btn cs-btn-primary" disabled={added} onClick={() => {
                update({ shortlist: [{ id: newId(), title: v.title, url: isVintedUrl(link) ? link.trim() : "", verdict: v.verdict, date: new Date().toISOString().slice(0, 10) }, ...p.shortlist] });
                setAdded(true);
                clearPicked(imgs); setImgs([]);
              }}>{added ? t("added") : t("addShortlist")}</button>
            </div>
          </div>
        )}
      </Panel>

      <Panel title={t("shortlistTitle")}>
        {p.shortlist.length === 0 ? <p className="cs-hint">{t("shortlistEmpty")}</p> : (
          <ul className="list">
            {p.shortlist.map((s) => (
              <li key={s.id}>
                <span>
                  {s.url ? <a className="cs-link" href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> : <b>{s.title}</b>}
                  <span className="cs-hint"> · {{ buy: t("vBuy"), maybe: t("vMaybe"), skip: t("vSkip") }[s.verdict]} · {s.date}</span>
                </span>
                <button type="button" className="cs-btn cs-btn-text" onClick={() => update({ shortlist: p.shortlist.filter((x) => x.id !== s.id) })}>{t("remove")}</button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
