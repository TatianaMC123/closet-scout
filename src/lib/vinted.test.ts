import { describe, expect, it } from "vitest";
import { describeFilters, parseCalibration, vintedUrl, type VintedSettings } from "./vinted";

const base: VintedSettings = { domain: "vinted.es", order: "newest_first", filters: {} };

describe("vintedUrl", () => {
  it("builds a newest-first search with a price limit", () => {
    const url = new URL(vintedUrl(base, "  barbour chaqueta encerada ", { maxPrice: 60 }));
    expect(url.origin).toBe("https://www.vinted.es");
    expect(url.pathname).toBe("/catalog");
    expect(url.searchParams.get("search_text")).toBe("barbour chaqueta encerada");
    expect(url.searchParams.get("price_to")).toBe("60");
    expect(url.searchParams.get("currency")).toBe("EUR");
    expect(url.searchParams.get("order")).toBe("newest_first");
  });

  it("adds the saved size filters for the item's group only", () => {
    const s: VintedSettings = { ...base, filters: { clothing: "size_ids[]=3&size_ids[]=4&catalog[]=1904", shoes: "size_ids[]=58" } };
    const url = new URL(vintedUrl(s, "abrigo lana", { group: "clothing" }));
    expect(url.searchParams.getAll("size_ids[]")).toEqual(["3", "4"]);
    expect(url.searchParams.getAll("catalog[]")).toEqual(["1904"]);
    const none = new URL(vintedUrl(s, "bolso", { group: "none" }));
    expect(none.searchParams.getAll("size_ids[]")).toEqual([]);
  });

  it("ignores a missing or invalid price and an unknown domain", () => {
    const url = new URL(vintedUrl({ ...base, domain: "evil.example" }, "jersey", { maxPrice: "abc" }));
    expect(url.hostname).toBe("www.vinted.es");
    expect(url.searchParams.has("price_to")).toBe(false);
  });

  it("never lets saved filters override the search words or order", () => {
    const s: VintedSettings = { ...base, filters: { clothing: "search_text=hack&order=price_high&size_ids[]=3" } };
    const url = new URL(vintedUrl(s, "camisa", { group: "clothing" }));
    expect(url.searchParams.getAll("search_text")).toEqual(["camisa"]);
    expect(url.searchParams.getAll("order")).toEqual(["newest_first"]);
  });
});

describe("parseCalibration", () => {
  it("keeps filter params and the domain from a Vinted link", () => {
    const r = parseCalibration("https://www.vinted.fr/catalog?catalog[]=1904&size_ids[]=3&search_text=x&page=2&time=1700000000");
    expect(r).toEqual({ params: "catalog%5B%5D=1904&size_ids%5B%5D=3", domain: "vinted.fr" });
  });
  it("rejects other sites and non-URLs", () => {
    expect(parseCalibration("https://example.com/catalog?size_ids[]=3")).toEqual({ error: "not_vinted" });
    expect(parseCalibration("http://www.vinted.es/catalog")).toEqual({ error: "not_vinted" });
    expect(parseCalibration("size 38")).toEqual({ error: "not_url" });
  });
});

describe("describeFilters", () => {
  it("summarises filter params", () => {
    expect(describeFilters("size_ids[]=3&size_ids[]=4&catalog[]=1904")).toBe("size ×2, category");
    expect(describeFilters("")).toBe("");
  });
});
