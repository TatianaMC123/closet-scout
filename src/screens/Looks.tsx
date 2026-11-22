import { useState } from "react";
import { clearPicked, ImagePicker, type Picked } from "../components/ImagePicker";
import { AskButton, ErrorText, Panel, SizeTag, TextField, useAsk } from "../components/ui";
import { ask, ClaudeError } from "../lib/claude";
import { prepareImage } from "../lib/images";
import { bodyColourPrompt, looksPrompt } from "../lib/prompts";
import { BodyColourSchema, LooksSchema } from "../lib/schemas";
import { useApp } from "../state";

export function Looks() {
  const { profile: p, update, t, apiKey } = useApp();
  const looks = useAsk();
  const body = useAsk();
  const [imgs, setImgs] = useState<Picked[]>([]);
  const [bodyImgs, setBodyImgs] = useState<Picked[]>([]);
  const [note, setNote] = useState("");
  const [lastLooks, setLastLooks] = useState<string[]>([]);
  const bc = p.bodyColour;

  return (
    <>
      <Panel title={t("looksTitle")} hint={t("looksHint")}>
        <ImagePicker id="looks-picker" images={imgs} onChange={setImgs} />
        <TextField label={t("looksNote")} value={note} placeholder={t("looksNotePh")} onChange={setNote} />
        <div className="cs-row">
          <AskButton label={t("looksBtn")} busy={looks.busy} onStop={looks.stop} disabled={!imgs.length}
            onClick={() => looks.run(async (signal) => {
              if (!imgs.length) throw new ClaudeError("bad_request");
              const prepared = await Promise.all(imgs.map((i) => prepareImage(i.file)));
              const r = await ask({ apiKey, model: p.model, schema: LooksSchema, prompt: looksPrompt(p, prepared.length, note), images: prepared, signal });
              const date = new Date().toISOString().slice(0, 10);
              update((cur) => ({
                lookNotes: [...cur.lookNotes, ...r.looks.map((l) => `${date}: ${l}`)].slice(-40),
                styleDNA: r.styleDNA || cur.styleDNA,
                styles: [...cur.styles, ...r.newStyles.filter((s) => !cur.styles.includes(s))],
                colours: [...cur.colours, ...r.newColours.map((c) => c.toLowerCase()).filter((c) => !cur.colours.includes(c))],
              }));
              setLastLooks(r.looks);
              clearPicked(imgs); setImgs([]); setNote("");
            })} />
        </div>
        <ErrorText error={looks.error} />
        {lastLooks.length > 0 && (
          <>
            <ul className="clean">{lastLooks.map((l) => <li key={l}>{l}</li>)}</ul>
            <p className="cs-hint">{t("looksDone")}</p>
          </>
        )}
      </Panel>

      <Panel title={t("dnaTitle")} action={(p.styleDNA || p.lookNotes.length > 0) && (
        <button type="button" className="cs-btn cs-btn-text" onClick={() => update({ styleDNA: "", lookNotes: [] })}>{t("clearNotes")}</button>
      )}>
        {p.styleDNA ? <p className="prewrap">{p.styleDNA}</p> : <p className="cs-hint">{t("dnaEmpty")}</p>}
        {p.lookNotes.length > 0 && (
          <details>
            <summary>{p.lookNotes.length} {t("lookNotes")}</summary>
            <ul className="clean">{p.lookNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </details>
        )}
      </Panel>

      <Panel title={t("bodyTitle")} hint={t("bodyHint")}>
        <ImagePicker id="body-picker" images={bodyImgs} onChange={setBodyImgs} />
        <div className="cs-row">
          <AskButton primary={false} label={t("bodyBtn")} busy={body.busy} onStop={body.stop} disabled={!bodyImgs.length}
            onClick={() => body.run(async (signal) => {
              const prepared = await Promise.all(bodyImgs.map((i) => prepareImage(i.file)));
              const r = await ask({ apiKey, model: p.model, schema: BodyColourSchema, prompt: bodyColourPrompt(p), images: prepared, signal });
              update({ bodyColour: r });
              clearPicked(bodyImgs); setBodyImgs([]);
            })} />
        </div>
        <ErrorText error={body.error} />
        {bc && (
          <>
            <div className="labels">
              <SizeTag caption={t("bodyShape")} value={bc.bodyShape} />
              <SizeTag caption={t("colourSeason")} value={bc.colourSeason} />
              <SizeTag caption={t("confidence")} value={bc.confidence} />
            </div>
            <p>{bc.proportions}</p>
            {bc.bestColours.length > 0 && <p><b>{t("bestColours")}:</b> {bc.bestColours.join(", ")}</p>}
            <p className="cs-hint">{bc.caveats}</p>
          </>
        )}
      </Panel>
    </>
  );
}
