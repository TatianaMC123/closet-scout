import { AskButton, ErrorText, NumberField, Panel, SelectField, SizeTag, TextField, useAsk } from "../components/ui";
import { ask } from "../lib/claude";
import { sizesPrompt } from "../lib/prompts";
import { SizeGuideSchema } from "../lib/schemas";
import { isPetite, isTall, LETTERS, type Letter } from "../lib/sizes";
import { useApp } from "../state";

export function Fit() {
  const { profile: p, update, t, apiKey } = useApp();
  const a = useAsk();
  const num = (k: "heightCm" | "weightKg" | "sizeBottomEU" | "jeansW" | "jeansL" | "shoeEU" | "bustCm" | "waistCm" | "hipsCm" | "insideLegCm" | "budgetMax", step?: string) => (
    <NumberField label={t(k)} value={p[k]} step={step} onChange={(v) => update({ [k]: v })} />
  );
  const g = p.sizeGuide;

  return (
    <>
      <Panel title={t("fitTitle")} hint={t("fitHint")}>
        <div className="grid">
          {num("heightCm")}
          {num("weightKg")}
          <SelectField<Letter | "">
            label={t("sizeTop")} value={p.sizeTop}
            options={[{ value: "", label: "—" }, ...LETTERS.map((l) => ({ value: l, label: l }))]}
            onChange={(v) => update({ sizeTop: v })}
          />
          {num("sizeBottomEU")}
          {num("jeansW")}
          {num("jeansL")}
          {num("shoeEU", "0.5")}
          {num("budgetMax")}
        </div>
        <div className="grid">
          {num("bustCm")}
          {num("waistCm")}
          {num("hipsCm")}
          {num("insideLegCm")}
        </div>
        {isPetite(p.heightCm) && <p className="cs-note">{t("petiteHint")}</p>}
        {isTall(p.heightCm) && <p className="cs-note">{t("tallHint")}</p>}
        <TextField label={t("fitNotes")} value={p.fitNotes} placeholder={t("fitNotesPh")} multiline onChange={(v) => update({ fitNotes: v })} />
      </Panel>

      <Panel
        title={t("guideTitle")}
        hint={t("guideHint")}
        action={<AskButton label={t("guideBtn")} busy={a.busy} onStop={a.stop} onClick={() => a.run(async (signal) => {
          const guide = await ask({ apiKey, model: p.model, schema: SizeGuideSchema, prompt: sizesPrompt(p), signal });
          update({ sizeGuide: guide });
        })} />}
      >
        <ErrorText error={a.error} />
        {!g ? (
          <p className="cs-hint">{t("guideEmpty")}</p>
        ) : (
          <>
            <div className="labels">
              {([["gTops", g.tops], ["gDresses", g.dresses], ["gTrousers", g.trousers], ["gJeans", g.jeans], ["gShoes", g.shoes], ["gOther", g.otherSystems]] as const)
                .filter(([, v]) => v)
                .map(([k, v]) => <SizeTag key={k} caption={t(k)} value={v} />)}
            </div>
            {g.measurementsToAsk.length > 0 && (
              <div>
                <b>{t("askSellerFor")}</b>
                <ul className="clean">{g.measurementsToAsk.map((m) => <li key={m}>{m}</li>)}</ul>
              </div>
            )}
            {g.basedOn && <p className="cs-hint">{t("basedOn")}: {g.basedOn}</p>}
            {g.notes && <p>{g.notes}</p>}
          </>
        )}
      </Panel>
    </>
  );
}
