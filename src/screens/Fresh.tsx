import { useState } from "react";
import { AskButton, EmptyState, ErrorText, Panel, useAsk } from "../components/ui";
import { applyDiff, diffAlerts, needsSeasonalRefresh, type AlertDiff, type AlertSearch } from "../lib/alerts";
import { ask } from "../lib/claude";
import { alertsPrompt } from "../lib/prompts";
import { AlertsSchema } from "../lib/schemas";
import { newId } from "../lib/store";
import { vintedUrl } from "../lib/vinted";
import { useApp } from "../state";

type Proposed = Omit<AlertSearch, "id" | "savedInVinted">;

export function Fresh() {
  const { profile: p, update, t, apiKey } = useApp();
  const a = useAsk();
  const [diff, setDiff] = useState<AlertDiff<Proposed> | null>(null);
  const saved = p.alerts.filter((x) => x.savedInVinted).length;
  const url = (x: { query: string; maxPrice?: number | null; group: AlertSearch["group"] }) =>
    vintedUrl(p.vinted, x.query, { maxPrice: x.maxPrice, group: x.group, order: "newest_first" });
  const setSaved = (id: string, v: boolean) => update({ alerts: p.alerts.map((x) => (x.id === id ? { ...x, savedInVinted: v } : x)) });

  const apply = () => {
    if (!diff) return;
    update({ alerts: applyDiff(p.alerts, diff, newId), alertsUpdated: new Date().toISOString() });
    setDiff(null);
  };

  return (
    <>
      <Panel
        title={t("freshTitle")}
        hint={t("freshHow")}
        action={<AskButton label={p.alerts.length ? t("freshRefreshBtn") : t("freshBtn")} busy={a.busy} onStop={a.stop}
          onClick={() => a.run(async (signal) => {
            const r = await ask({ apiKey, model: p.model, schema: AlertsSchema, prompt: alertsPrompt(p, p.alerts), effort: "high", signal });
            const proposed: Proposed[] = r.alerts.slice(0, 10).map((x) => ({ ...x, maxPrice: x.maxPrice || null }));
            const d = diffAlerts(p.alerts, proposed);
            if (p.alerts.length === 0) {
              update({ alerts: applyDiff([], d, newId), alertsUpdated: new Date().toISOString() });
            } else {
              setDiff(d);
            }
          })} />}
      >
        <p className="cs-hint">{t("freshWhy")}</p>
        {needsSeasonalRefresh(p.alertsUpdated, new Date()) && !diff && <p className="cs-note">{t("freshSeason")}</p>}
        <ErrorText error={a.error} />

        {diff && (
          <div className="diff">
            <h3 className="sub">{t("diffTitle")}</h3>
            {diff.add.length === 0 && diff.remove.length === 0 ? (
              <p>{t("diffNone")}</p>
            ) : (
              <>
                {diff.add.map((x) => <p key={"a" + x.query}><span className="cs-pill cs-pill-price">{t("diffAdd")}</span> <b>{x.title}</b> · <span className="cs-hint">{x.why}</span></p>)}
                {diff.remove.map((x) => <p key={"r" + x.id}><span className="cs-pill cs-pill-brand">{t("diffRemove")}</span> <b>{x.title}</b></p>)}
              </>
            )}
            <div className="cs-row">
              <button type="button" className="cs-btn cs-btn-primary" onClick={apply}>{t("diffApply")}</button>
              <button type="button" className="cs-btn" onClick={() => setDiff(null)}>{t("diffDiscard")}</button>
            </div>
          </div>
        )}

        {p.alerts.length === 0 ? (
          <EmptyState eyebrow={t("tabFresh")} title={t("freshEmptyTitle")} text={t("freshEmpty")} />
        ) : (
          <>
            <p><b>{t("freshSavedCount", { saved, total: p.alerts.length })}</b> <span className="cs-hint">{t("notifTip")}</span></p>
            <div className="cards">
              {p.alerts.map((x) => (
                <article className="cs-card" key={x.id}>
                  {x.savedInVinted ? <span className="cs-saved">{t("savedInVinted")}</span> : <span className="cs-unsaved">{t("notSavedYet")}</span>}
                  <h3>{x.title}</h3>
                  <p className="cs-hint">{x.savedInVinted ? x.why : t("bellTip")}</p>
                  <span className="cs-query">“{x.query}”{x.maxPrice ? ` · ≤ ${x.maxPrice} €` : ""}</span>
                  <div className="cs-row">
                    <a className="cs-link" target="_blank" rel="noopener noreferrer" href={url(x)}>{t("openVinted")}</a>
                    {x.savedInVinted ? (
                      <button type="button" className="cs-btn cs-btn-text" onClick={() => setSaved(x.id, false)}>{t("undoSaved")}</button>
                    ) : (
                      <button type="button" className="cs-btn" onClick={() => setSaved(x.id, true)}>{t("iSavedIt")}</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </Panel>

      {p.alerts.length > 0 && (
        <Panel title={t("newestTitle")} hint={t("newestHint")}>
          <ul className="list">
            {p.alerts.map((x) => (
              <li key={x.id}>
                <a className="cs-link" target="_blank" rel="noopener noreferrer" href={url(x)}>{x.title} ↗</a>
                <span className="cs-hint">{x.maxPrice ? `≤ ${x.maxPrice} €` : ""}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
