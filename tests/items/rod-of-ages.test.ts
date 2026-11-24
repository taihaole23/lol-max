import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";

test("full stacks: 45 + 30 = 75 AP, and 350 + 100 bonus health", () => {
  const stats = championStats("katarina", 6, [getItem("Rod of Ages")]);
  expect(stats.ap).toBeCloseTo(75);
  // The extra level: her base stats are level 7's.
  expect(stats.health).toBeCloseTo(championStats("katarina", 7, []).health + 450);
});

test("the extra level also raises her bonus attack speed (which Death Lotus uses)", () => {
  const stats = championStats("katarina", 6, [getItem("Rod of Ages")]);
  expect(stats.bonusAttackSpeed).toBeCloseTo(championStats("katarina", 7, []).bonusAttackSpeed);
});

test("the extra level can't go past 18", () => {
  const stats = championStats("katarina", 18, [getItem("Rod of Ages")]);
  expect(stats.health).toBeCloseTo(championStats("katarina", 18, []).health + 450);
});
