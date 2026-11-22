import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";

test("Overlord's alone: 40 AD + 2.5% of 550 bonus health = 53.75 bonus AD (the wiki's own note)", () => {
  expect(katarinaStats(6, [getItem("Overlord's Bloodmail")]).bonusAd).toBeCloseTo(53.75);
});

test("Overlord's counts health from other items too", () => {
  // Bonus health: 550 + Warmog's 1000 + 12% of 1550 (= 186) = 1736. 40 + 2.5% × 1736 = 83.4
  const stats = katarinaStats(6, [getItem("Overlord's Bloodmail"), getItem("Warmog's Armor")]);
  expect(stats.bonusAd).toBeCloseTo(83.4);
});
