import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { bootsPool, legendaryPool } from "../../src/optimizer/item-pool.ts";
import { simulateBuild } from "../../src/simulation/simulate-build.ts";
import { easyDummy } from "../items/helpers.ts";

const total = (level: number, names: string[], extra: string[] = []) =>
  simulateBuild("katarina", level, [...names, ...extra].map(getItem), easyDummy).events.reduce((sum, e) => sum + e.amount, 0);

test("the filter removes only Frozen Heart (patch 26.23)", () => {
  expect(legendaryPool().removedByFilter.map((i) => i.name)).toEqual(["Frozen Heart"]);
});

test("every removed item really changes nothing, alone or next to stat-reading passives", () => {
  // Riftmaker (HP → AP), Swiftmarch (move speed → AP), Rabadon's (× AP), Overlord's (HP → AD).
  for (const removed of legendaryPool().removedByFilter) {
    for (const build of [[], ["Riftmaker"], ["Rabadon's Deathcap", "Swiftmarch"], ["Overlord's Bloodmail"]]) {
      expect(total(16, build, [removed.name])).toBeCloseTo(total(16, build));
    }
  }
});

test("Runaan's Hurricane (ranged only) is never in the pool", () => {
  const names = (useFilter: boolean) => legendaryPool(useFilter).legendaries.map((i) => i.name);
  expect(names(true)).not.toContain("Runaan's Hurricane");
  expect(names(false)).not.toContain("Runaan's Hurricane");
});

test("boots: tier-2, tier-3 with the mid quest, none when off", () => {
  expect(bootsPool("tier2").every((i) => i.category === "boots")).toBe(true);
  expect(bootsPool("tier3").every((i) => i.category === "boots-tier-3")).toBe(true);
  expect(bootsPool("tier2").length).toBeGreaterThan(0);
  expect(bootsPool("tier3").length).toBeGreaterThan(0);
  expect(bootsPool("off")).toEqual([]);
});
