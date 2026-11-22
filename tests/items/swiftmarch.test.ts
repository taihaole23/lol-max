import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";
import { totalMoveSpeed } from "../../src/formulas/move-speed.ts";

test("move speed soft caps (the wiki's example: 600 raw → 530)", () => {
  expect(totalMoveSpeed(400, 0)).toBe(400); // under 415: no cap
  expect(totalMoveSpeed(400, 0.5)).toBeCloseTo(530); // 600 raw
  expect(totalMoveSpeed(450, 0)).toBeCloseTo(415 + 35 * 0.8); // between the caps
});

test("Swiftmarch alone: 5% of (335 + 65) move speed = 20 adaptive force → 20 AP", () => {
  // Bonus AD and AP are both 0, a tie, so Katarina's adaptive type decides: AP.
  const stats = katarinaStats(6, [getItem("Swiftmarch")]);
  expect(stats.ap).toBeCloseTo(20);
  expect(stats.bonusAd).toBe(0);
});

test("with more bonus AD than AP, it gives bonus AD instead: 20 × 0.6 = 12", () => {
  const ie = getItem("Infinity Edge");
  const stats = katarinaStats(6, [getItem("Swiftmarch"), ie]);
  expect(stats.bonusAd).toBeCloseTo((ie.stats.attackDamage ?? 0) + 12);
  expect(stats.ap).toBe(0);
});

test("% move speed from items counts, with the soft cap", () => {
  // Phantom Dancer: +10%. 400 × 1.1 = 440 raw → 415 + 25 × 0.8 = 435 → 5% = 21.75 AP
  const stats = katarinaStats(6, [getItem("Swiftmarch"), getItem("Phantom Dancer")]);
  expect(stats.ap).toBeCloseTo(21.75);
});

test("Rabadon's multiplies the adaptive AP too", () => {
  // (130 + 20) × 1.3 = 195
  const stats = katarinaStats(6, [getItem("Swiftmarch"), getItem("Rabadon's Deathcap")]);
  expect(stats.ap).toBeCloseTo(195);
});
