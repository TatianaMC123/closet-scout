import { del, get, set } from "idb-keyval";
import type { AlertSearch } from "./alerts";
import type { BodyColour, Search, SizeGuide, Verdict } from "./schemas";
import type { Letter } from "./sizes";
import type { VintedSettings } from "./vinted";

export type Lang = "en" | "es";
export type ModelId = "claude-opus-5-5" | "claude-sonnet-5-5" | "claude-haiku-5-5";

export interface WardrobeItem { id: string; item: string; colour: string; }
export interface ShortItem { id: string; title: string; url: string; verdict: Verdict["verdict"]; date: string; }

export interface Profile {
  version: 1;
  onboarded: boolean;
  lang: Lang;
  model: ModelId;
  // Fit
  heightCm: number | null;
  weightKg: number | null;
  sizeTop: Letter | "";
  sizeBottomEU: number | null;
  jeansW: number | null;
  jeansL: number | null;
  shoeEU: number | null;
  bustCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  insideLegCm: number | null;
  fitNotes: string;
  budgetMax: number | null;
  sizeGuide: SizeGuide | null;
  // Style
  styles: string[];
  colours: string[];
  avoid: string;
  brands: string[];
  similarBrands: { brand: string; price: string; why: string }[];
  influencers: string[];
  influencerNotes: string;
  lookNotes: string[];
  styleDNA: string;
  bodyColour: BodyColour | null;
  wardrobe: WardrobeItem[];
  // Shopping
  vinted: VintedSettings;
  searches: Search[];
  alerts: AlertSearch[];
  alertsUpdated: string | null;
  shortlist: ShortItem[];
}

export function blankProfile(lang: Lang = "en"): Profile {
  return {
    version: 1, onboarded: false, lang, model: "claude-opus-5-5",
    heightCm: null, weightKg: null, sizeTop: "", sizeBottomEU: null, jeansW: null, jeansL: null, shoeEU: null,
    bustCm: null, waistCm: null, hipsCm: null, insideLegCm: null, fitNotes: "", budgetMax: null, sizeGuide: null,
    styles: [], colours: [], avoid: "", brands: [], similarBrands: [], influencers: [], influencerNotes: "",
    lookNotes: [], styleDNA: "", bodyColour: null, wardrobe: [],
    vinted: { domain: "vinted.es", order: "newest_first", filters: {} },
    searches: [], alerts: [], alertsUpdated: null, shortlist: [],
  };
}

const PROFILE_KEY = "closet-scout:profile";
const API_KEY = "closet-scout:anthropic-key";

/** Fills in fields a newer version added, so old saved profiles keep working. */
export function normalizeProfile(raw: unknown): Profile {
  const base = blankProfile();
  if (!raw || typeof raw !== "object") return base;
  const p = { ...base, ...(raw as Partial<Profile>) };
  p.vinted = { ...base.vinted, ...(p.vinted ?? {}), filters: { ...(p.vinted?.filters ?? {}) } };
  for (const k of ["styles", "colours", "brands", "similarBrands", "influencers", "lookNotes", "wardrobe", "searches", "alerts", "shortlist"] as const) {
    if (!Array.isArray(p[k])) (p as Record<string, unknown>)[k] = [];
  }
  p.version = 1;
  return p;
}

export async function loadProfile(): Promise<Profile | null> {
  const raw = await get(PROFILE_KEY);
  return raw ? normalizeProfile(raw) : null;
}

export function saveProfile(p: Profile): Promise<void> {
  return set(PROFILE_KEY, p);
}

export const loadApiKey = (): Promise<string | undefined> => get(API_KEY);
export const saveApiKey = (key: string): Promise<void> => set(API_KEY, key.trim());
export const removeApiKey = (): Promise<void> => del(API_KEY);

export async function deleteEverything(): Promise<void> {
  await del(PROFILE_KEY);
  await del(API_KEY);
}

/** The backup file never contains the API key. */
export function exportProfile(p: Profile): string {
  return JSON.stringify({ app: "closet-scout", exported: new Date().toISOString(), profile: p }, null, 2);
}

export function importProfile(text: string): Profile {
  const data = JSON.parse(text);
  if (!data || data.app !== "closet-scout" || !data.profile) throw new Error("not_a_backup");
  return normalizeProfile({ ...data.profile, onboarded: true });
}

export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
