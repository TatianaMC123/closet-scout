import { describe, expect, it } from "vitest";
import { alertKey, applyDiff, diffAlerts, needsSeasonalRefresh, seasonOf, type AlertSearch } from "./alerts";

const a = (query: string, saved = false, group: AlertSearch["group"] = "clothing"): AlertSearch => ({
  id: query, title: query, query, group, why: "", savedInVinted: saved,
});

describe("alerts", () => {
  it("treats case and spacing as the same search", () => {
    expect(alertKey({ query: " Jersey  Lana ", group: "clothing" })).toBe(alertKey({ query: "jersey lana", group: "clothing" }));
    expect(alertKey({ query: "botines", group: "shoes" })).not.toBe(alertKey({ query: "botines", group: "clothing" }));
  });

  it("lists what to add and remove after a profile change", () => {
    const current = [a("jersey lana", true), a("vaqueros rectos", true, "trousers")];
    const proposed = [
      { title: "Wool jumper", query: "Jersey lana", group: "clothing" as const, why: "" },
      { title: "Trench", query: "gabardina trench", group: "clothing" as const, why: "" },
    ];
    const d = diffAlerts(current, proposed);
    expect(d.add.map((x) => x.query)).toEqual(["gabardina trench"]);
    expect(d.remove.map((x) => x.query)).toEqual(["vaqueros rectos"]);
    expect(d.keep.map((x) => x.query)).toEqual(["jersey lana"]);
    let n = 0;
    const next = applyDiff(current, d, () => `new-${++n}`);
    expect(next.map((x) => [x.query, x.savedInVinted])).toEqual([["jersey lana", true], ["gabardina trench", false]]);
  });

  it("knows the seasons and when to suggest a refresh", () => {
    expect(seasonOf(new Date("2026-11-22"))).toBe("autumn");
    expect(seasonOf(new Date("2027-01-05"))).toBe("winter");
    expect(needsSeasonalRefresh("2026-10-01", new Date("2026-11-22"))).toBe(false);
    expect(needsSeasonalRefresh("2026-10-01", new Date("2026-12-02"))).toBe(true);
    expect(needsSeasonalRefresh(null, new Date())).toBe(false);
  });
});
