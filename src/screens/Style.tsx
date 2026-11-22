import { useState } from "react";
import { AskButton, ChipToggles, ErrorText, handle, Panel, TagInput, TextField, useAsk } from "../components/ui";
import { COLOURS, STYLES } from "../data/catalog";
import { ask } from "../lib/claude";
import { influencersPrompt, similarBrandsPrompt } from "../lib/prompts";
import { InfluencersSchema, SimilarBrandsSchema } from "../lib/schemas";
import { newId } from "../lib/store";
import { useApp } from "../state";

export function Style() {
  const { profile: p, update, t, lang, apiKey } = useApp();
  const sim = useAsk();
  const infl = useAsk();
  const [item, setItem] = useState("");
  const [colour, setColour] = useState("");

  const styleOptions = STYLES.map((s) => ({ id: s[lang], label: s[lang] }));
  // Keep any styles Claude added from looks visible too.
  for (const s of p.styles) if (!styleOptions.some((o) => o.id === s)) styleOptions.push({ id: s, label: s });
  const colourOptions = COLOURS.map((c) => ({ id: c[lang], label: c[lang], swatch: c.swatch }));
  for (const c of p.colours) if (!colourOptions.some((o) => o.id === c)) colourOptions.push({ id: c, label: c, swatch: "" });

  return (
    <>
      <Panel title={t("stylesTitle")}>
        <ChipToggles options={styleOptions} selected={p.styles} onChange={(styles) => update({ styles })} />
        <h3 className="sub">{t("coloursTitle")}</h3>
        <ChipToggles options={colourOptions} selected={p.colours} onChange={(colours) => update({ colours })} />
        <TextField label={t("avoid")} value={p.avoid} placeholder={t("avoidPh")} onChange={(avoid) => update({ avoid })} />
      </Panel>

      <Panel title={t("brandsTitle")}>
        <TagInput values={p.brands} placeholder={t("brandPh")} onChange={(brands) => update({ brands })} />
        <div className="panel-head">
          <h3 className="sub">{t("similarTitle")}</h3>
          <AskButton primary={false} label={t("similarBtn")} busy={sim.busy} onStop={sim.stop} disabled={!p.brands.length}
            onClick={() => sim.run(async (signal) => {
              const r = await ask({ apiKey, model: p.model, schema: SimilarBrandsSchema, prompt: similarBrandsPrompt(p), effort: "low", signal });
              update({ similarBrands: r.brands.slice(0, 10) });
            })} />
        </div>
        <ErrorText error={sim.error} />
        {p.similarBrands.length === 0 ? (
          <p className="cs-hint">{t("similarEmpty")}</p>
        ) : (
          <div className="cards">
            {p.similarBrands.map((b) => {
              const has = p.brands.includes(b.brand);
              return (
                <article className="cs-card" key={b.brand}>
                  <div className="cs-row"><h3>{b.brand}</h3><span className="cs-pill cs-pill-price">{b.price}</span></div>
                  <p className="cs-hint">{b.why}</p>
                  <button type="button" className="cs-btn" disabled={has} onClick={() => update({ brands: [...p.brands, b.brand] })}>
                    {has ? t("inBrands") : t("addToBrands")}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title={t("inflTitle")} hint={t("inflHint")}>
        <TagInput values={p.influencers} placeholder={t("inflPh")} normalize={handle} onChange={(influencers) => update({ influencers })} />
        <div className="cs-row">
          <AskButton primary={false} label={t("inflBtn")} busy={infl.busy} onStop={infl.stop} disabled={!p.influencers.length}
            onClick={() => infl.run(async (signal) => {
              const r = await ask({ apiKey, model: p.model, schema: InfluencersSchema, prompt: influencersPrompt(p), signal });
              const lines = r.people.map((x) => `${x.handle}: ${x.known && x.style ? x.style : t("inflUnknown")}`);
              update({ influencerNotes: lines.join("\n") + (r.commonThread ? `\n\n${t("commonThread")}: ${r.commonThread}` : "") });
            })} />
        </div>
        <ErrorText error={infl.error} />
        {p.influencerNotes && <p className="prewrap">{p.influencerNotes}</p>}
      </Panel>

      <Panel title={t("wardrobeTitle")} hint={t("wardrobeHint")}>
        <form className="cs-row nowrap" onSubmit={(e) => {
          e.preventDefault();
          if (!item.trim()) return;
          update({ wardrobe: [...p.wardrobe, { id: newId(), item: item.trim(), colour: colour.trim() }] });
          setItem(""); setColour("");
        }}>
          <input className="grow" value={item} placeholder={t("wardrobeItemPh")} aria-label={t("wardrobeItem")} onChange={(e) => setItem(e.target.value)} />
          <input className="narrow" value={colour} placeholder={t("wardrobeColour")} aria-label={t("wardrobeColour")} onChange={(e) => setColour(e.target.value)} />
          <button type="submit" className="cs-btn">{t("add")}</button>
        </form>
        {p.wardrobe.length === 0 ? <p className="cs-hint">{t("none")}</p> : (
          <ul className="list">
            {p.wardrobe.map((w) => (
              <li key={w.id}>
                <span>{w.item}{w.colour && <span className="cs-hint"> · {w.colour}</span>}</span>
                <button type="button" className="cs-btn cs-btn-text" onClick={() => update({ wardrobe: p.wardrobe.filter((x) => x.id !== w.id) })}>{t("remove")}</button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
