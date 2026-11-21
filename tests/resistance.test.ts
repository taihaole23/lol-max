// Tests for armor/MR. Known answers are the wiki's own examples
// (Armor, Armor penetration and Magic penetration pages).
import { test, expect } from "vitest";
import { damageMultiplier, effectiveResist, noShred } from "../src/formulas/resistance.ts";

test("wiki: 1000 damage into 0 / 25 / 100 / 200 armor", () => {
  expect(1000 * damageMultiplier(0)).toBe(1000);
  expect(1000 * damageMultiplier(25)).toBeCloseTo(800);
  expect(1000 * damageMultiplier(100)).toBeCloseTo(500);
  expect(1000 * damageMultiplier(200)).toBeCloseTo(333.33, 2);
});

test("wiki: -100 armor means taking 1.5× damage", () => {
  expect(damageMultiplier(-100)).toBeCloseTo(1.5);
});

test("no shred leaves resist unchanged", () => {
  expect(effectiveResist(100, 200, noShred)).toBe(300);
});

test("wiki armor example A: 300 armor (100 base, 200 bonus) counts as 122.3", () => {
  const shred = {
    flatReduction: 30,
    percentReduction: 0.3,
    percentPenetration: 0,
    percentBonusPenetration: 0.45,
    flatPenetration: 10,
  };
  expect(effectiveResist(100, 200, shred)).toBeCloseTo(122.3);
});

test("wiki armor example B: flat reduction takes 18 armor down to -12", () => {
  const shred = {
    flatReduction: 30,
    percentReduction: 0.3,
    percentPenetration: 0,
    percentBonusPenetration: 0.45,
    flatPenetration: 10,
  };
  expect(effectiveResist(18, 0, shred)).toBeCloseTo(-12);
});

test("wiki magic example A: 80 MR counts as 17.3", () => {
  const shred = {
    flatReduction: 20,
    percentReduction: 0.3,
    percentPenetration: 0.35,
    percentBonusPenetration: 0,
    flatPenetration: 10,
  };
  expect(effectiveResist(80, 0, shred)).toBeCloseTo(17.3);
});

test("wiki magic example B: 18 MR goes down to -2", () => {
  const shred = {
    flatReduction: 20,
    percentReduction: 0.3,
    percentPenetration: 0.35,
    percentBonusPenetration: 0,
    flatPenetration: 10,
  };
  expect(effectiveResist(18, 0, shred)).toBeCloseTo(-2);
});

test("wiki: 10% pen + 30% bonus pen on 20 base / 40 bonus counts as 43.2", () => {
  const shred = { ...noShred, percentPenetration: 0.1, percentBonusPenetration: 0.3 };
  expect(effectiveResist(20, 40, shred)).toBeCloseTo(43.2);
});

test("wiki: flat penetration can't go below 0", () => {
  expect(effectiveResist(30, 0, { ...noShred, flatPenetration: 20 })).toBeCloseTo(10);
  expect(effectiveResist(10, 0, { ...noShred, flatPenetration: 25 })).toBe(0);
});
