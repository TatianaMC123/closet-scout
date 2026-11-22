import { describe, expect, it } from "vitest";
import { blankProfile, exportProfile, importProfile, normalizeProfile } from "./store";

describe("store", () => {
  it("fills in missing fields from older saves", () => {
    const p = normalizeProfile({ heightCm: 168, brands: "not-an-array", vinted: { domain: "vinted.fr" } });
    expect(p.heightCm).toBe(168);
    expect(p.brands).toEqual([]);
    expect(p.vinted).toEqual({ domain: "vinted.fr", order: "newest_first", filters: {} });
    expect(p.model).toBe("claude-opus-5-5");
  });

  it("round-trips a backup without the API key", () => {
    const p = { ...blankProfile("es"), onboarded: true, brands: ["Mango"], heightCm: 170 };
    const text = exportProfile(p);
    expect(text).not.toMatch(/sk-ant/);
    const back = importProfile(text);
    expect(back.brands).toEqual(["Mango"]);
    expect(back.lang).toBe("es");
    expect(back.onboarded).toBe(true);
  });

  it("refuses files that aren't Closet Scout backups", () => {
    expect(() => importProfile('{"hello":1}')).toThrow("not_a_backup");
    expect(() => importProfile("nope")).toThrow();
  });
});
