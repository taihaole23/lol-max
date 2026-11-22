import { test, expect } from "vitest";
import { run } from "./helpers.ts";

test("15 + 15% AP per dagger: 80 AP → 27 × 0.35 × 15 daggers = 141.75", () => {
  expect(run(16, ["Nashor's Tooth"]).breakdown.bySource["Nashor's Tooth"]).toBeCloseTo(141.75);
});

test("uses AP from other items and passives: + Rabadon's → AP (80 + 130) × 1.3 = 273", () => {
  // 15 + 0.15 × 273 = 55.95 → × 0.35 × 15 = 293.7375
  const damage = run(16, ["Nashor's Tooth", "Rabadon's Deathcap"]).breakdown.bySource["Nashor's Tooth"];
  expect(damage).toBeCloseTo(293.7375);
});
