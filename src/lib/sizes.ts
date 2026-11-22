// Women's clothing size conversions. These are common approximations, not brand charts:
// the app always tells users to check the brand's own chart and the flat measurements.

export const LETTERS = ["XXS", "XS", "S", "M", "L", "XL", "XXL"] as const;
export type Letter = (typeof LETTERS)[number];

const LETTER_TO_EU: Record<Letter, number> = { XXS: 32, XS: 34, S: 36, M: 38, L: 40, XL: 42, XXL: 44 };

export function letterToEu(letter: Letter): number {
  return LETTER_TO_EU[letter];
}

export function euToLetter(eu: number): Letter | null {
  const hit = LETTERS.find((l) => LETTER_TO_EU[l] === eu);
  return hit ?? null;
}

/** EU (German/Spanish) dress size to other systems. */
export function convertEu(eu: number): { eu: number; fr: number; it: number; uk: number; us: number } {
  return { eu, fr: eu + 2, it: eu + 4, uk: eu - 28, us: eu - 32 };
}

/** UK, US, FR or IT label to the EU size, so a listing's label can be compared with the user's. */
export function toEu(system: "eu" | "fr" | "it" | "uk" | "us", value: number): number {
  switch (system) {
    case "eu": return value;
    case "fr": return value - 2;
    case "it": return value - 4;
    case "uk": return value + 28;
    case "us": return value + 32;
  }
}

/** Flat armpit-to-armpit width to an approximate chest circumference. */
export function flatToCircumference(flatCm: number): number {
  return Math.round(flatCm * 2);
}

/** Below about 160 cm many regular lengths (sleeves, legs, dresses) run long. */
export function isPetite(heightCm: number | null | undefined): boolean {
  return typeof heightCm === "number" && heightCm > 0 && heightCm <= 160;
}

export function isTall(heightCm: number | null | undefined): boolean {
  return typeof heightCm === "number" && heightCm >= 176;
}
