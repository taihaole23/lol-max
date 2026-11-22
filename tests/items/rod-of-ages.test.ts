import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";

test("full stacks: 45 + 30 = 75 AP, and 350 + 100 bonus health", () => {
  const stats = katarinaStats(6, [getItem("Rod of Ages")]);
  expect(stats.ap).toBeCloseTo(75);
  // The extra level: her base stats are level 7's.
  expect(stats.health).toBeCloseTo(katarinaStats(7, []).health + 450);
});

test("the extra level also raises her bonus attack speed (which Death Lotus uses)", () => {
  const stats = katarinaStats(6, [getItem("Rod of Ages")]);
  expect(stats.bonusAttackSpeed).toBeCloseTo(katarinaStats(7, []).bonusAttackSpeed);
});

test("the extra level can't go past 18", () => {
  const stats = katarinaStats(18, [getItem("Rod of Ages")]);
  expect(stats.health).toBeCloseTo(katarinaStats(18, []).health + 450);
});
