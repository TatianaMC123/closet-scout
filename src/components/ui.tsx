import { useEffect, useRef, useState, type ReactNode } from "react";
import { ClaudeError } from "../lib/claude";
import type { StringKey } from "../lib/i18n";
import { useApp } from "../state";

export function Panel({ title, hint, action, children }: { title?: string; hint?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <section className="panel">
      {(title || action) && (
        <div className="panel-head">
          {title && <h2>{title}</h2>}
          {action}
        </div>
      )}
      {hint && <p className="cs-hint">{hint}</p>}
      {children}
    </section>
  );
}

export function NumberField({ label, value, onChange, placeholder, step }: {
  label: string; value: number | null; onChange: (v: number | null) => void; placeholder?: string; step?: string;
}) {
  const [text, setText] = useState(value == null ? "" : String(value));
  useEffect(() => { setText(value == null ? "" : String(value)); }, [value]);
  return (
    <label className="cs-field">
      {label}
      <input
        type="number" inputMode="decimal" step={step ?? "1"} value={text} placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseFloat(e.target.value.replace(",", "."));
          onChange(Number.isFinite(n) ? n : null);
        }}
      />
    </label>
  );
}

export function TextField({ label, value, onChange, placeholder, multiline, type }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; type?: string;
}) {
  return (
    <label className="cs-field">
      {label}
      {multiline ? (
        <textarea value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type ?? "text"} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

export function SelectField<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <label className="cs-field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function ChipToggles({ options, selected, onChange }: {
  options: { id: string; label: string; swatch?: string }[]; selected: string[]; onChange: (next: string[]) => void;
}) {
  return (
    <div className="cs-row">
      {options.map((o) => {
        const on = selected.includes(o.id);
        return (
          <button key={o.id} type="button" className="cs-chip" aria-pressed={on}
            onClick={() => onChange(on ? selected.filter((x) => x !== o.id) : [...selected, o.id])}>
            {o.swatch && <span className="swatch" style={{ background: o.swatch }} aria-hidden="true" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function TagInput({ values, onChange, placeholder, normalize }: {
  values: string[]; onChange: (next: string[]) => void; placeholder: string; normalize?: (s: string) => string;
}) {
  const { t } = useApp();
  const [text, setText] = useState("");
  const add = () => {
    const v = (normalize ?? ((s: string) => s))(text.trim());
    if (v && !values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setText("");
  };
  return (
    <div className="cs-stack">
      <div className="cs-row nowrap">
        <input className="grow" value={text} placeholder={placeholder} aria-label={placeholder}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
        <button type="button" className="cs-btn" onClick={add}>{t("add")}</button>
      </div>
      <div className="cs-row">
        {values.length === 0 && <span className="cs-hint">{t("none")}</span>}
        {values.map((v) => (
          <span key={v} className="cs-chip tag">
            {v}
            <button type="button" aria-label={`${t("remove")} ${v}`} onClick={() => onChange(values.filter((x) => x !== v))}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export function SizeTag({ caption, value }: { caption: string; value: string }) {
  return <div className="cs-tag"><small>{caption}</small><b>{value}</b></div>;
}

export function EmptyState({ eyebrow, title, text, action }: { eyebrow?: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="cs-empty">
      {eyebrow && <span className="cs-label">{eyebrow}</span>}
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function ErrorText({ error }: { error: unknown }) {
  const { t } = useApp();
  if (!error) return null;
  const code = error instanceof ClaudeError ? error.code : "unknown";
  return <p className="cs-error" role="alert">{t(`err_${code}` as StringKey)}</p>;
}

/** Runs one Claude request with Thinking…/Stop/error states. */
export function useAsk() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const ctl = useRef<AbortController | null>(null);
  const run = async (fn: (signal: AbortSignal) => Promise<void>) => {
    ctl.current?.abort();
    const c = new AbortController();
    ctl.current = c;
    setBusy(true);
    setError(null);
    try {
      await fn(c.signal);
    } catch (e) {
      if (!(e instanceof ClaudeError && e.code === "cancelled")) setError(e);
    } finally {
      if (ctl.current === c) setBusy(false);
    }
  };
  const stop = () => { ctl.current?.abort(); setBusy(false); };
  return { busy, error, setError, run, stop };
}

export function AskButton({ label, busy, onClick, onStop, primary = true, disabled }: {
  label: string; busy: boolean; onClick: () => void; onStop: () => void; primary?: boolean; disabled?: boolean;
}) {
  const { t } = useApp();
  return busy ? (
    <span className="cs-row">
      <span className="thinking" role="status">{t("thinking")}</span>
      <button type="button" className="cs-btn" onClick={onStop}>{t("stop")}</button>
    </span>
  ) : (
    <button type="button" className={primary ? "cs-btn cs-btn-primary" : "cs-btn"} onClick={onClick} disabled={disabled}>{label}</button>
  );
}

export function Logo({ small }: { small?: boolean }) {
  return (
    <span className={"cs-logo" + (small ? " small" : "")}>
      <img className="cs-on-light" src="brand/closet-scout-mark.svg" alt="" />
      <img className="cs-on-dark" src="brand/closet-scout-mark-light.svg" alt="" />
      Closet Scout
    </span>
  );
}

export const handle = (s: string) =>
  s ? (s.startsWith("@") ? s : "@" + s.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/[/?#].*$/, "")) : s;
