import type { SizeGroup } from "../lib/vinted";

export interface CatalogItem {
  id: string;
  en: string;
  es: string;
  /** Words that work in Vinted's search box on Spanish-speaking sites. */
  query: string;
  group: SizeGroup;
}

export const ITEMS: CatalogItem[] = [
  { id: "barn", en: "Barn / waxed jacket", es: "Chaqueta encerada", query: "chaqueta encerada", group: "clothing" },
  { id: "trench", en: "Trench coat", es: "Gabardina", query: "gabardina trench", group: "clothing" },
  { id: "coat", en: "Wool coat", es: "Abrigo de lana", query: "abrigo lana", group: "clothing" },
  { id: "puffer", en: "Puffer jacket", es: "Plumífero", query: "plumífero", group: "clothing" },
  { id: "jumper", en: "Knit jumper", es: "Jersey de punto", query: "jersey punto", group: "clothing" },
  { id: "cardigan", en: "Cardigan", es: "Cárdigan", query: "cárdigan punto", group: "clothing" },
  { id: "shirt", en: "Shirt / blouse", es: "Camisa / blusa", query: "camisa", group: "clothing" },
  { id: "blazer", en: "Blazer", es: "Americana", query: "blazer americana", group: "clothing" },
  { id: "dress", en: "Dress", es: "Vestido", query: "vestido", group: "clothing" },
  { id: "skirt", en: "Midi skirt", es: "Falda midi", query: "falda midi", group: "clothing" },
  { id: "jeans", en: "Straight jeans", es: "Vaqueros rectos", query: "vaqueros rectos", group: "trousers" },
  { id: "wide", en: "Wide-leg trousers", es: "Pantalón ancho", query: "pantalón ancho", group: "trousers" },
  { id: "leggings", en: "Leggings", es: "Mallas", query: "mallas", group: "trousers" },
  { id: "ankleboots", en: "Ankle boots", es: "Botines", query: "botines", group: "shoes" },
  { id: "boots", en: "Knee boots", es: "Botas altas", query: "botas altas", group: "shoes" },
  { id: "trainers", en: "Trainers", es: "Zapatillas", query: "zapatillas", group: "shoes" },
  { id: "dance", en: "Dance shoes", es: "Zapatos de baile", query: "zapatos de baile", group: "shoes" },
  { id: "bag", en: "Bag", es: "Bolso", query: "bolso", group: "none" },
  { id: "scarf", en: "Scarf", es: "Bufanda", query: "bufanda", group: "none" },
];

export const STYLES: { id: string; en: string; es: string }[] = [
  { id: "classic", en: "Timeless classic", es: "Clásico atemporal" },
  { id: "quiet", en: "Quiet luxury", es: "Lujo silencioso" },
  { id: "scandi", en: "Scandi minimal", es: "Minimal escandinavo" },
  { id: "parisian", en: "Parisian chic", es: "Chic parisino" },
  { id: "country", en: "Countryside / barn jacket", es: "Campestre / chaqueta encerada" },
  { id: "office", en: "Smart office", es: "Oficina elegante" },
  { id: "athleisure", en: "Athleisure", es: "Athleisure" },
  { id: "outdoor", en: "Outdoor / gorpcore", es: "Outdoor / gorpcore" },
  { id: "romantic", en: "Romantic / feminine", es: "Romántico / femenino" },
  { id: "boho", en: "Boho", es: "Boho" },
  { id: "seventies", en: "Vintage 70s", es: "Vintage años 70" },
  { id: "preppy", en: "Preppy", es: "Preppy" },
  { id: "street", en: "Street style", es: "Street style" },
  { id: "colourful", en: "Colourful / dopamine dressing", es: "Colorido / dopamine dressing" },
  { id: "nightout", en: "Night out / dance", es: "Noche / baile" },
];

export const COLOURS: { id: string; en: string; es: string; swatch: string }[] = [
  { id: "pink", en: "pink", es: "rosa", swatch: "#E8457C" },
  { id: "blue", en: "cobalt blue", es: "azul cobalto", swatch: "#2459C2" },
  { id: "yellow", en: "butter yellow", es: "amarillo mantequilla", swatch: "#FFD95A" },
  { id: "red", en: "red", es: "rojo", swatch: "#C62828" },
  { id: "burgundy", en: "burgundy", es: "burdeos", swatch: "#7B2D3B" },
  { id: "green", en: "green", es: "verde", swatch: "#2E7D4F" },
  { id: "olive", en: "olive", es: "oliva", swatch: "#6B7A3A" },
  { id: "camel", en: "camel", es: "camel", swatch: "#C19A6B" },
  { id: "chocolate", en: "chocolate", es: "chocolate", swatch: "#5B3A29" },
  { id: "cream", en: "cream", es: "crema", swatch: "#F3EAD3" },
  { id: "white", en: "white", es: "blanco", swatch: "#FFFFFF" },
  { id: "grey", en: "grey", es: "gris", swatch: "#9E9E9E" },
  { id: "navy", en: "navy", es: "azul marino", swatch: "#1F2A44" },
  { id: "black", en: "black", es: "negro", swatch: "#111111" },
  { id: "denim", en: "denim blue", es: "azul vaquero", swatch: "#5A7DB0" },
  { id: "lilac", en: "lilac", es: "lila", swatch: "#B79CE0" },
];
