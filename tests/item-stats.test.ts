// Tests for adding up Katarina's and the dummy's stats from level + items.
import { test, expect } from "vitest";
import { combinePercent } from "../src/stats/combine.ts";
import { katarinaStats, rRankAtLevel } from "../src/stats/katarina-stats.ts";
import { dummyStats, recommendedDummyItems } from "../src/stats/dummy-stats.ts";
import { getItem, items } from "../src/data/items.ts";

test("combinePercent: 40% and 30% make 58%, not 70%", () => {
  expect(combinePercent([0.4, 0.3])).toBeCloseTo(0.58);
  expect(combinePercent([0.4])).toBeCloseTo(0.4);
  expect(combinePercent([])).toBe(0);
});

test("Katarina with no items at level 6: wiki's 10.82% bonus attack speed, nothing else", () => {
  const stats = katarinaStats(6, []);
  expect(stats.ap).toBe(0);
  expect(stats.bonusAd).toBe(0);
  expect(stats.bonusAttackSpeed).toBeCloseTo(0.1082, 4);
});

test("Void Staff + Sorcerer's Shoes: 95 AP, 40% and 12 flat magic pen", () => {
  const stats = katarinaStats(11, [getItem("Void Staff"), getItem("Sorcerer's Shoes")]);
  expect(stats.ap).toBe(95);
  expect(stats.magicShred.percentPenetration).toBeCloseTo(0.4);
  expect(stats.magicShred.flatPenetration).toBe(12);
});

test("Youmuu's lethality becomes flat armor pen; Lord Dominik's gives % armor pen", () => {
  const stats = katarinaStats(16, [getItem("Youmuu's Ghostblade"), getItem("Lord Dominik's Regards")]);
  expect(stats.bonusAd).toBe(55 + 35);
  expect(stats.armorShred.flatPenetration).toBe(18);
  expect(stats.armorShred.percentPenetration).toBeCloseTo(0.35);
});

test("R rank: 6-10 → 1, 11-15 → 2, 16+ → 3, none before 6", () => {
  expect(rRankAtLevel(6)).toBe(1);
  expect(rRankAtLevel(10)).toBe(1);
  expect(rRankAtLevel(11)).toBe(2);
  expect(rRankAtLevel(16)).toBe(3);
  expect(rRankAtLevel(18)).toBe(3);
  expect(() => rRankAtLevel(5)).toThrow();
});

test("Sion, Late (level 16), recommended items, worked out by hand", () => {
  // Level 16 growth factor: 15 × (0.7025 + 0.0175 × 15) = 14.475
  // Champion (wiki): HP 655 + 95, armor 36 + 4.2, MR 32 + 2.05 per level.
  // Items (item data): Plated Steelcaps 25 armor; Hollow Radiance 400 HP, 40 MR;
  //   Titanic Hydra 600 HP; Unending Despair 400 HP, 50 armor.
  const target = dummyStats("sion", 16, recommendedDummyItems("tank", "late"));
  expect(target.hp).toBeCloseTo(655 + 95 * 14.475 + 400 + 600 + 400);
  expect(target.bonusHp).toBe(400 + 600 + 400);
  expect(target.baseArmor).toBeCloseTo(36 + 4.2 * 14.475);
  expect(target.bonusArmor).toBe(25 + 50);
  expect(target.baseMagicResist).toBeCloseTo(32 + 2.05 * 14.475);
  expect(target.bonusMagicResist).toBe(40);
});

test("recommended items: boots + the first N items in buy order", () => {
  const early = recommendedDummyItems("squishy", "early").map((i) => i.name);
  expect(early).toEqual(["Ionian Boots of Lucidity", "Dream Maker"]);
  expect(recommendedDummyItems("tank", "full")).toHaveLength(6);
});

test("no item Katarina can buy has Adaptive Force (we don't handle it)", () => {
  // If a future patch adds it, this fails, and we add the AD-or-AP rule then.
  const buyable = items.filter((i) => i.category !== "support");
  expect(buyable.filter((i) => i.stats.adaptiveForce)).toEqual([]);
});
