// Tests for raw Death Lotus damage. Known answers come from the wiki.
import { test, expect } from "vitest";
import { daggerMagicDamage, daggerPhysicalDamage, fullChannelRawDamage } from "../src/formulas/death-lotus.ts";
import { statAtLevel } from "../src/formulas/stats.ts";
import { katarina } from "../src/data/katarina.ts";

test("magic per dagger: 25 / 37.5 / 50 + 19% AP", () => {
  expect(daggerMagicDamage(1, 0)).toBe(25);
  expect(daggerMagicDamage(3, 0)).toBe(50);
  expect(daggerMagicDamage(2, 100)).toBeCloseTo(37.5 + 19);
});

test("physical per dagger: 16% bonus AD with no bonus attack speed", () => {
  expect(daggerPhysicalDamage(100, 0)).toBeCloseTo(16);
});

test("physical per dagger: 100% bonus attack speed makes it 66% bonus AD", () => {
  expect(daggerPhysicalDamage(100, 1)).toBeCloseTo(66);
});

test("wiki: at level 6, the physical part is at least 21.41% bonus AD", () => {
  const bonusAttackSpeed = statAtLevel(0, katarina.baseStats.attackSpeed.bonusPerLevel, 6);
  expect(daggerPhysicalDamage(100, bonusAttackSpeed)).toBeCloseTo(21.41, 2);
});

test("wiki: full channel maximum is 750 + 285% AP and 240% bonus AD at rank 3", () => {
  const damage = fullChannelRawDamage(3, 100, 100, 0);
  expect(damage.magic).toBeCloseTo(750 + 285);
  expect(damage.physical).toBeCloseTo(240);
});
