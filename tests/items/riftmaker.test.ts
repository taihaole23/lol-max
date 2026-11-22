import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";

test("Riftmaker alone: 70 AP + 2% of 350 bonus health = 77 AP (the wiki's own note)", () => {
  expect(katarinaStats(6, [getItem("Riftmaker")]).ap).toBeCloseTo(77);
});

test("health from levels doesn't count, only BONUS health", () => {
  // Same build at level 6 and level 18: more base health, same AP.
  const early = katarinaStats(6, [getItem("Riftmaker")]);
  const late = katarinaStats(18, [getItem("Riftmaker")]);
  expect(late.health).toBeGreaterThan(early.health);
  expect(late.ap).toBeCloseTo(early.ap);
});
