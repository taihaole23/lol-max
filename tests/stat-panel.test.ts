// The stat panel numbers the "minimum stats" boxes compare against (src/stats/stat-panel.ts).
import { test, expect } from "vitest";
import { attackSpeed } from "../src/data/game-rules.ts";
import { getItem } from "../src/data/items.ts";
import { katarina } from "../src/data/katarina.ts";
import { statAtLevel } from "../src/formulas/stats.ts";
import { meetsMinimums, panelStats } from "../src/stats/stat-panel.ts";

test("no items: the champion's own stats at her level (AD is TOTAL AD)", () => {
  const stats = panelStats("katarina", 18, []);
  const base = katarina.baseStats;
  expect(stats.attackDamage).toBeCloseTo(statAtLevel(base.attackDamage.base, base.attackDamage.perLevel, 18));
  expect(stats.armor).toBeCloseTo(statAtLevel(base.armor.base, base.armor.perLevel, 18));
  expect(stats.magicResist).toBeCloseTo(statAtLevel(base.magicResist.base, base.magicResist.perLevel, 18));
  expect(stats.health).toBeCloseTo(statAtLevel(base.health.base, base.health.perLevel, 18));
  expect(stats.abilityPower).toBe(0);
  expect(stats.critChance).toBe(0);
  expect(stats.abilityHaste).toBe(0);
  expect(stats.moveSpeed).toBe(base.moveSpeed);
  // Level 18: 17 levels of bonus attack speed growth = 17 × growth (statAtLevel's 17 × 1).
  expect(stats.attackSpeed).toBeCloseTo(base.attackSpeed.base * (1 + 17 * base.attackSpeed.bonusPerLevel));
});

test("item stats add up: Frozen Heart's armor and ability haste", () => {
  const without = panelStats("katarina", 11, []);
  const withIt = panelStats("katarina", 11, [getItem("Frozen Heart")]);
  expect(withIt.armor - without.armor).toBe(75);
  expect(withIt.abilityHaste).toBe(20);
});

test("item passives count: Rabadon's +30% AP", () => {
  const stats = panelStats("katarina", 11, [getItem("Rabadon's Deathcap"), getItem("Lich Bane")]);
  expect(stats.abilityPower).toBeCloseTo((130 + 100) * 1.3);
});

test("Yone's passive doubles crit: 2 crit items = 100% crit chance", () => {
  const stats = panelStats("yone", 11, [getItem("Infinity Edge"), getItem("Phantom Dancer")], "q");
  expect(stats.critChance).toBeCloseTo(1);
  expect(panelStats("katarina", 11, [getItem("Infinity Edge"), getItem("Phantom Dancer")]).critChance).toBeCloseTo(0.5);
});

test("attack speed never goes above the cap", () => {
  const fast = ["Phantom Dancer", "Guinsoo's Rageblade", "Kraken Slayer", "Statikk Shiv", "Nashor's Tooth", "Wit's End"].map(getItem);
  expect(panelStats("katarina", 18, fast).attackSpeed).toBeLessThanOrEqual(attackSpeed.cap);
});

test("meetsMinimums: every listed stat must be reached, unlisted ones are free", () => {
  const stats = panelStats("katarina", 11, [getItem("Rabadon's Deathcap")]);
  expect(meetsMinimums(stats, {})).toBe(true);
  expect(meetsMinimums(stats, { abilityPower: 169 })).toBe(true); // 130 × 1.3 = 169
  expect(meetsMinimums(stats, { abilityPower: 170 })).toBe(false);
  expect(meetsMinimums(stats, { abilityPower: 100, armor: 500 })).toBe(false);
});
