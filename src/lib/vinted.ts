// Builds Vinted search links. Vinted has no public search API and its terms forbid
// scraping, so the app never reads Vinted: it only opens normal search pages.
// If Vinted ever offers a public API, this is the one module to change.

export type SizeGroup = "clothing" | "trousers" | "shoes" | "none";

export interface VintedSettings {
  domain: string; // e.g. "vinted.es"
  order: "newest_first" | "relevance" | "price_low_to_high";
  /** Extra filter params copied from a filtered Vinted link, per size group. */
  filters: Partial<Record<SizeGroup, string>>;
}

export const DOMAINS = ["vinted.es", "vinted.pt", "vinted.fr", "vinted.it", "vinted.de", "vinted.co.uk", "vinted.nl", "vinted.be", "vinted.pl"];

/** Params we set ourselves or that only make sense for one visit. */
export const SKIP = new Set([
  "search_text", "order", "price_from", "price_to", "currency", "page", "time",
  "search_id", "search_by_image_uuid", "disabled_personalization",
]);

export function vintedUrl(
  settings: VintedSettings,
  query: string,
  opts: { maxPrice?: number | string | null; group?: SizeGroup; order?: VintedSettings["order"] } = {},
): string {
  const p = new URLSearchParams();
  p.set("search_text", query.trim());
  const price = Number(opts.maxPrice);
  if (Number.isFinite(price) && price > 0) {
    p.set("price_to", String(Math.round(price)));
    p.set("currency", "EUR");
  }
  p.set("order", opts.order ?? settings.order ?? "newest_first");
  const extra = opts.group ? settings.filters[opts.group] : undefined;
  if (extra) for (const [k, v] of new URLSearchParams(extra)) if (!SKIP.has(k)) p.append(k, v);
  const domain = DOMAINS.includes(settings.domain) ? settings.domain : "vinted.es";
  return `https://www.${domain}/catalog?${p}`;
}

export type CalibrationResult = { params: string; domain: string } | { error: "not_vinted" | "not_url" };

/** Reads the filter params (sizes, category, condition…) out of a Vinted catalogue link. */
export function parseCalibration(url: string): CalibrationResult {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return { error: "not_url" };
  }
  const host = u.hostname.replace(/^www\./, "");
  if (u.protocol !== "https:" || !/^vinted\.[a-z.]+$/.test(host)) return { error: "not_vinted" };
  const keep = new URLSearchParams();
  for (const [k, v] of u.searchParams) if (!SKIP.has(k)) keep.append(k, v);
  return { params: keep.toString(), domain: host };
}

const FILTER_NAMES: Record<string, string> = {
  size_ids: "size", catalog: "category", status_ids: "condition", brand_ids: "brand",
  color_ids: "colour", material_ids: "material",
};

/** "size ×2, category" — a short human description of saved filters. */
export function describeFilters(params: string): string {
  const counts: Record<string, number> = {};
  for (const [k] of new URLSearchParams(params)) {
    const n = k.replace("[]", "");
    counts[n] = (counts[n] ?? 0) + 1;
  }
  const parts = Object.entries(counts).map(([k, n]) => `${FILTER_NAMES[k] ?? k}${n > 1 ? " ×" + n : ""}`);
  return parts.join(", ");
}
