import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { totalMoveSpeed } from "../../src/formulas/move-speed.ts";

const hexplate = getItem("Experimental Hexplate");

test("Overdrive: +50% bonus attack speed on top of her levels and the item's own 20%", () => {
  const withoutItem = championStats("katarina", 16, []).bonusAttackSpeed;
  const stats = championStats("katarina", 16, [hexplate]);
  expect(stats.bonusAttackSpeed).toBeCloseTo(withoutItem + (hexplate.stats.attackSpeed ?? 0) + 0.5);
});

test("Overdrive: +20% move speed", () => {
  expect(championStats("katarina", 16, [hexplate]).percentMoveSpeed).toBeCloseTo(0.2);
});

test("Swiftmarch counts Overdrive's move speed", () => {
  // (335 + 65) × 1.2 = 480 raw → soft cap → 467. 5% = 23.35 adaptive force.
  // Hexplate's AD is more than her AP (0), so it becomes bonus AD: 23.35 × 0.6 = 14.01.
  const speed = totalMoveSpeed(400, 0.2);
  expect(speed).toBeCloseTo(467);
  const stats = championStats("katarina", 16, [getItem("Swiftmarch"), hexplate]);
  expect(stats.bonusAd).toBeCloseTo((hexplate.stats.attackDamage ?? 0) + 0.05 * speed * 0.6);
});
