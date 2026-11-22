import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";

test("Sterak's at level 1: 50% of 58 base AD = 29 bonus AD", () => {
  expect(katarinaStats(1, [getItem("Sterak's Gage")]).bonusAd).toBeCloseTo(29);
});

test("Sterak's at level 18: 50% of 112.4 base AD = 56.2 bonus AD", () => {
  // Base AD at 18: 58 + 3.2 × 17 × (0.7025 + 0.0175 × 17) = 58 + 54.4 = 112.4
  expect(katarinaStats(18, [getItem("Sterak's Gage")]).bonusAd).toBeCloseTo(56.2);
});
