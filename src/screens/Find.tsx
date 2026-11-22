import { useState } from "react";
import { AskButton, EmptyState, ErrorText, Panel, SelectField, TextField, useAsk } from "../components/ui";
import { ITEMS } from "../data/catalog";
import { ask } from "../lib/claude";
import { searchesPrompt } from "../lib/prompts";
import { SearchesSchema, type Search } from "../lib/schemas";
import { vintedUrl } from "../lib/vinted";
import { useApp } from "../state";

export function SearchCard({ s }: { s: Search }) {
  const { profile: p, t } = useApp();
  return (
    <article className="cs-card">
      <div className="cs-row">
        <span className="cs-pill">{s.group}</span>
        {s.brand && <span className="cs-pill cs-pill-brand">{s.brand}</span>}
        {s.maxPrice > 0 && <span className="cs-pill cs-pill-price">≤ {s.maxPrice} €</span>}
      </div>
      <h3>{s.title}</h3>
      <p className="cs-hint">{s.why}</p>
      {s.sizeTip && <p className="cs-score">{t("size")}: {s.sizeTip}</p>}
      <span className="cs-query">“{s.query}”</span>
      <a className="cs-link" target="_blank" rel="noopener noreferrer" href={vintedUrl(p.vinted, s.query, { maxPrice: s.maxPrice, group: s.group })}>{t("openVinted")}</a>
    </article>
  );
}

export function Find() {
  const { profile: p, update, t, lang, apiKey } = useApp();
  const a = useAsk();
  const [focus, setFocus] = useState("");
  const [itemId, setItemId] = useState(ITEMS[0].id);
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState(p.budgetMax ? String(p.budgetMax) : "");
  const [extra, setExtra] = useState("");
  const item = ITEMS.find((i) => i.id === itemId) ?? ITEMS[0];
  const quickQuery = [brand, item.query, extra.trim()].filter(Boolean).join(" ");
  const brandOptions = [...new Set([...p.brands, ...p.similarBrands.map((b) => b.brand)])];

  return (
    <>
      <Panel title={t("findTitle")} hint={t("findHint")}>
        <TextField label={t("findFocus")} value={focus} placeholder={t("findFocusPh")} onChange={setFocus} />
        <div className="cs-row">
          <AskButton label={t("findBtn")} busy={a.busy} onStop={a.stop}
            onClick={() => a.run(async (signal) => {
              const r = await ask({ apiKey, model: p.model, schema: SearchesSchema, prompt: searchesPrompt(p, focus.trim()), effort: "high", signal });
              update({ searches: r.searches.slice(0, 16) });
            })} />
        </div>
        <ErrorText error={a.error} />
        {p.searches.length === 0 ? (
          <EmptyState eyebrow={t("tabFind")} title={t("findEmptyTitle")} text={t("findEmpty")} />
        ) : (
          <div className="cards">{p.searches.map((s, i) => <SearchCard key={i + s.query} s={s} />)}</div>
        )}
      </Panel>

      <Panel title={t("quickTitle")} hint={t("quickHint")}>
        <div className="grid">
          <SelectField label={t("item")} value={itemId} options={ITEMS.map((i) => ({ value: i.id, label: i[lang] }))} onChange={setItemId} />
          <SelectField label={t("brand")} value={brand} options={[{ value: "", label: t("anyBrand") }, ...brandOptions.map((b) => ({ value: b, label: b }))]} onChange={setBrand} />
          <TextField label={t("maxEur")} value={price} type="number" onChange={setPrice} />
          <TextField label={t("extraWords")} value={extra} onChange={setExtra} />
        </div>
        <div className="cs-row">
          <a className="cs-btn cs-btn-primary linkbtn" target="_blank" rel="noopener noreferrer" href={vintedUrl(p.vinted, quickQuery, { maxPrice: price, group: item.group })}>{t("openVinted")}</a>
          <span className="cs-query">“{quickQuery}”</span>
        </div>
      </Panel>
    </>
  );
}
