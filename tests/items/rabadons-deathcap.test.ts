import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";

test("Rabadon's alone: 130 AP × 1.3 = 169 AP", () => {
  expect(katarinaStats(6, [getItem("Rabadon's Deathcap")]).ap).toBeCloseTo(169);
});

test("Rabadon's also multiplies AP from other passives (Riftmaker)", () => {
  // Riftmaker: 70 AP + 2% of its 350 health = 77. Total (130 + 77) × 1.3 = 269.1
  const stats = katarinaStats(6, [getItem("Rabadon's Deathcap"), getItem("Riftmaker")]);
  expect(stats.ap).toBeCloseTo(269.1);
});

test("the order of items in the build doesn't matter", () => {
  const a = katarinaStats(6, [getItem("Rabadon's Deathcap"), getItem("Riftmaker")]);
  const b = katarinaStats(6, [getItem("Riftmaker"), getItem("Rabadon's Deathcap")]);
  expect(a.ap).toBeCloseTo(b.ap);
});
