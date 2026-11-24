import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";

const level6Health = championStats("katarina", 6, []).health;

test("Warmog's alone: 1000 health + 12% of 1000 = 1120 bonus health", () => {
  expect(championStats("katarina", 6, [getItem("Warmog's Armor")]).health - level6Health).toBeCloseTo(1120);
});

test("Warmog's + Riftmaker: Riftmaker turns Warmog's extra health into AP too", () => {
  // Item health: 1000 + 350 = 1350. Warmog's adds 12% = 162, so bonus health = 1512.
  // Riftmaker: 70 AP + 2% of 1512 = 100.24 AP.
  const stats = championStats("katarina", 6, [getItem("Warmog's Armor"), getItem("Riftmaker")]);
  expect(stats.health - level6Health).toBeCloseTo(1512);
  expect(stats.ap).toBeCloseTo(100.24);
});

test("Warmog's doesn't count health from item passives (Rod of Ages' stacks)", () => {
  // Item health: 1000 + 350 = 1350 → Warmog's adds 162. Rod of Ages' passive adds 100.
  // Rod of Ages also adds a level, so compare with level 7's base health.
  const level7Health = championStats("katarina", 7, []).health;
  const stats = championStats("katarina", 6, [getItem("Warmog's Armor"), getItem("Rod of Ages")]);
  expect(stats.health - level7Health).toBeCloseTo(1350 + 162 + 100);
});
