import * as z from "zod/v4";

const group = z.enum(["clothing", "trousers", "shoes", "none"]);

export const SizeGuideSchema = z.object({
  tops: z.string(),
  dresses: z.string(),
  trousers: z.string(),
  jeans: z.string(),
  shoes: z.string(),
  otherSystems: z.string(),
  measurementsToAsk: z.array(z.string()),
  basedOn: z.string(),
  notes: z.string(),
});
export type SizeGuide = z.infer<typeof SizeGuideSchema>;

export const SimilarBrandsSchema = z.object({
  brands: z.array(z.object({ brand: z.string(), price: z.string(), why: z.string() })),
});

export const InfluencersSchema = z.object({
  people: z.array(z.object({ handle: z.string(), known: z.boolean(), style: z.string() })),
  commonThread: z.string(),
});

export const LooksSchema = z.object({
  looks: z.array(z.string()),
  styleDNA: z.string(),
  newStyles: z.array(z.string()),
  newColours: z.array(z.string()),
});

export const BodyColourSchema = z.object({
  bodyShape: z.string(),
  proportions: z.string(),
  colourSeason: z.string(),
  bestColours: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
  caveats: z.string(),
});
export type BodyColour = z.infer<typeof BodyColourSchema>;

export const SearchSchema = z.object({
  title: z.string(),
  query: z.string(),
  brand: z.string(),
  group,
  maxPrice: z.number(),
  why: z.string(),
  sizeTip: z.string(),
});
export type Search = z.infer<typeof SearchSchema>;

export const SearchesSchema = z.object({ searches: z.array(SearchSchema) });

export const AlertsSchema = z.object({
  alerts: z.array(z.object({ title: z.string(), query: z.string(), group, maxPrice: z.number(), why: z.string() })),
});

export const VerdictSchema = z.object({
  title: z.string(),
  verdict: z.enum(["buy", "maybe", "skip"]),
  fitScore: z.number(),
  styleScore: z.number(),
  fit: z.string(),
  style: z.string(),
  price: z.string(),
  goesWith: z.array(z.string()),
  watchOut: z.array(z.string()),
  askSeller: z.array(z.string()),
});
export type Verdict = z.infer<typeof VerdictSchema>;
