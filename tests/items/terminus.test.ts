import { test, expect } from "vitest";
import { run } from "./helpers.ts";

test("Shadow: 30 + 10% bonus AD (its own 30 AD) = 33 per dagger → 33 × 0.35 × 15 = 173.25", () => {
  expect(run(16, ["Terminus"]).breakdown.bySource["Terminus"]).toBeCloseTo(173.25);
});

test("Shadow also scales with AP: + Rabadon's (169 AP) → 30 + 3 + 16.9 = 49.9 per dagger", () => {
  // 49.9 × 0.35 × 15 = 261.975
  expect(run(16, ["Terminus", "Rabadon's Deathcap"]).breakdown.bySource["Terminus"]).toBeCloseTo(261.975);
});
