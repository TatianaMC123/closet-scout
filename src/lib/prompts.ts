import { STYLIST_KNOWLEDGE } from "../data/knowledge";
import type { AlertSearch } from "./alerts";
import type { Profile } from "./store";

const LANG_NAME = { en: "English", es: "Spanish" } as const;

/** The parts of the profile Claude needs; never the key, settings or past answers it doesn't use. */
export function profileForPrompt(p: Profile): string {
  const keep = {
    heightCm: p.heightCm, weightKg: p.weightKg, usualTopSize: p.sizeTop || null, usualTrouserSizeEU: p.sizeBottomEU,
    jeans: p.jeansW ? `W${p.jeansW}${p.jeansL ? " L" + p.jeansL : ""}` : null, shoeEU: p.shoeEU,
    bustCm: p.bustCm, waistCm: p.waistCm, hipsCm: p.hipsCm, insideLegCm: p.insideLegCm,
    fitNotes: p.fitNotes || null, usualMaxPriceEUR: p.budgetMax,
    sizeGuide: p.sizeGuide, styles: p.styles, colours: p.colours, neverShow: p.avoid || null,
    favouriteBrands: p.brands, similarBrands: p.similarBrands.map((b) => b.brand),
    influencerNotes: p.influencerNotes || null, styleDNA: p.styleDNA || null,
    bodyAndColour: p.bodyColour, wardrobe: p.wardrobe.map((w) => `${w.item}${w.colour ? " (" + w.colour + ")" : ""}`),
  };
  return JSON.stringify(keep, (_k, v) => (v === null || v === "" || (Array.isArray(v) && v.length === 0) ? undefined : v), 1);
}

const frame = (p: Profile, task: string) => `You are Closet Scout, an honest, warm personal stylist for second-hand shopping on ${p.vinted.domain} (Vinted).
Write every text field in ${LANG_NAME[p.lang]}. Plain words, short sentences, explain why. Never promise a fit; say what a judgement is based on.

Stylist reference:
${STYLIST_KNOWLEDGE}

Client profile (JSON):
${profileForPrompt(p)}

Task:
${task}`;

export const sizesPrompt = (p: Profile) => frame(p, `Work out the sizes the client should filter by on Vinted and the flat garment measurements to ask sellers for, with target values in cm where their measurements allow. Respect their fit notes. If information is missing, give a best range and say what to measure.
Fields: tops, dresses, trousers (EU), jeans (W/L), shoes (EU), otherSystems (UK / US / FR / IT equivalents), measurementsToAsk (each "measurement: target"), basedOn (what you used), notes (2–3 sentences).`);

export const similarBrandsPrompt = (p: Profile) => frame(p, `Suggest 8 clothing brands similar in style, quality and price to the client's favourite brands: ${p.brands.join(", ")}. Prefer brands common on ${p.vinted.domain}. Don't repeat their brands. For each: brand, price ("€", "€€" or "€€€"), why (one sentence).`);

export const influencersPrompt = (p: Profile) => frame(p, `The client follows these Instagram stylists and influencers for outfit ideas: ${p.influencers.join(", ")}.
For each handle you genuinely recognise, describe their typical style in 1–2 sentences (silhouettes, colours, signature pieces, brands). If you don't recognise a handle, set known=false and leave style empty: never guess. Then write commonThread: the shared style as keywords they can shop for.`);

export const looksPrompt = (p: Profile, count: number, note: string) => frame(p, `The ${count} attached image(s) are outfits the client loves (screenshots from stylists or photos of themselves). ${note ? "Their note: " + note : ""}
For each image, in order, write one dense sentence: key pieces with fabric and cut, colours, silhouette, mood. If something isn't visible, don't invent it.
Then rewrite styleDNA (4–6 sentences: core silhouettes, palette, key second-hand pieces to hunt, fabrics, what to avoid), combining these looks with their existing style DNA.
newStyles and newColours: only clear additions, short words, may be empty.`);

export const bodyColourPrompt = (p: Profile) => frame(p, `The attached photo(s) show the client, ideally full length in daylight. Suggest, as options rather than rules:
- bodyShape (one of hourglass, pear, inverted triangle, rectangle, apple, or "unclear") and proportions (1–2 sentences on balance: torso/leg length, shoulders vs hips),
- colourSeason (12-season name or "unclear") and bestColours (6–8 colour names),
- confidence (low/medium/high) and caveats (always mention that light, filters and clothing affect this, and that an in-person draping is more reliable).
Be kind and neutral; describe, never judge bodies.`);

export const searchesPrompt = (p: Profile, focus: string) => frame(p, `Write 12 tailored searches for ${p.vinted.domain}.
- query: the words typed in Vinted's search box, 2–5 words, in the language sellers on ${p.vinted.domain} use (Spanish for vinted.es), usually brand + item + one detail. No sizes or prices in the query.
- Mix: about half their favourite brands, a quarter similar brands, the rest brand-free pieces matching their style DNA, influencers and wardrobe gaps.
- brand: the brand used, or empty. group: clothing, trousers, shoes or none (bags, accessories).
- maxPrice: a realistic second-hand price in € for that brand and item${p.budgetMax ? `, at most ${p.budgetMax} unless it's a long-lasting investment piece (say so in why)` : ""}.
- title: short name. why: one sentence, mention which owned pieces it goes with if possible. sizeTip: which label size to pick for this brand and which measurement to check.
${focus ? "- Focus on: " + focus : ""}`);

export const alertsPrompt = (p: Profile, current: AlertSearch[]) => frame(p, `Choose the 5–10 Vinted searches most worth saving as alerts, so Vinted notifies the client about new items that fit. They should run for weeks, so favour their core sizes, favourite and similar brands, colours and wardrobe gaps for the current season (today is ${new Date().toISOString().slice(0, 10)}).
Rules for query, group and maxPrice are the same as for searches: 2–5 words in the sellers' language, no sizes or prices in the words.
Their current alerts (keep the ones that still fit, using the exact same query text): ${JSON.stringify(current.map((a) => ({ query: a.query, group: a.group })))}
For each alert: title, query, group, maxPrice, why (one sentence).`);

export const checkPrompt = (p: Profile, hasImages: boolean, text: string) => frame(p, `Check a second-hand listing. ${hasImages ? "The attached image(s) are screenshots of the listing." : ""}
${text ? "Listing text:\n" + text : ""}
Judge: fit (size label and any measurements vs their body, size guide and fit notes; convert UK/US/FR/IT labels), style (vs their styles, colours, style DNA and never-list), price (vs typical second-hand prices for this brand and condition), visible condition problems and signs of fakes.
Fields: title (brand + item), verdict (buy / maybe / skip), fitScore and styleScore (0–10), fit (2–3 sentences), style (1–2), price (1), goesWith (up to 3 pieces from their wardrobe it pairs with; empty if none listed), watchOut (short items), askSeller (questions to send the seller, written in the language of ${p.vinted.domain}, e.g. Spanish for vinted.es).`);
