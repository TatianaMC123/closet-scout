import { describe, expect, it } from "vitest";
import { convertEu, euToLetter, flatToCircumference, isPetite, isTall, letterToEu, toEu } from "./sizes";

describe("sizes", () => {
  it("maps letters to EU and back", () => {
    expect(letterToEu("S")).toBe(36);
    expect(letterToEu("M")).toBe(38);
    expect(euToLetter(40)).toBe("L");
    expect(euToLetter(37)).toBeNull();
  });
  it("converts EU to other systems and back", () => {
    expect(convertEu(38)).toEqual({ eu: 38, fr: 40, it: 42, uk: 10, us: 6 });
    for (const sys of ["fr", "it", "uk", "us"] as const) expect(toEu(sys, convertEu(36)[sys])).toBe(36);
  });
  it("doubles a flat width", () => {
    expect(flatToCircumference(48.4)).toBe(97);
  });
  it("flags petite and tall heights", () => {
    expect(isPetite(158)).toBe(true);
    expect(isPetite(168)).toBe(false);
    expect(isPetite(undefined)).toBe(false);
    expect(isTall(178)).toBe(true);
  });
});
