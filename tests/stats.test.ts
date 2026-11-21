// Tests for statAtLevel. Known answers come from the wiki.
import { test, expect } from "vitest";
import { statAtLevel } from "../src/formulas/stats.ts";
import { katarina } from "../src/data/katarina.ts";

test("level 1 is exactly the base value", () => {
  expect(statAtLevel(672, 108, 1)).toBe(672);
});

test("level 18 is base + 17 × growth", () => {
  // 17 × (0.7025 + 0.0175 × 17) = 17 × 1 = 17
  expect(statAtLevel(32, 4.7, 18)).toBeCloseTo(32 + 17 * 4.7);
});

test("wiki example: Alistar's HP at level 2 is 771.4", () => {
  expect(statAtLevel(685, 120, 2)).toBeCloseTo(771.4);
});

test("wiki: Katarina has 10.82% bonus attack speed at level 6", () => {
  const growth = katarina.baseStats.attackSpeed.bonusPerLevel;
  expect(statAtLevel(0, growth, 6)).toBeCloseTo(0.1082, 4);
});
