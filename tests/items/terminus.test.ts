import { test, expect } from "vitest";
import { run, easyDummy } from "./helpers.ts";

const resistDummy = { ...easyDummy, baseArmor: 100, baseMagicResist: 100 };

// Dark hits are daggers 2, 4, 6, and each counts from the next dagger on.
// So dagger N (1-based) has min(floor((N - 1) / 2), 3) Dark stacks.
test("Juxtaposition: 10% armor and magic pen per Dark stack, up to 30%", () => {
  const raw = run(16, ["Terminus"]).events;
  const hits = run(16, ["Terminus"], resistDummy).events;
  for (const source of ["base", "bonusAdRatio"]) {
    const rawHits = raw.filter((e) => e.source === source);
    const resistHits = hits.filter((e) => e.source === source);
    for (let i = 0; i < 15; i++) {
      const stacks = Math.min(Math.floor(i / 2), 3);
      const resist = 100 * (1 - 0.1 * stacks);
      expect(resistHits[i].amount).toBeCloseTo(rawHits[i].amount * (100 / (100 + resist)));
    }
  }
});

test("Shadow: 30 + 10% bonus AD (its own 30 AD) = 33 per dagger → 33 × 0.35 × 15 = 173.25", () => {
  expect(run(16, ["Terminus"]).breakdown.bySource["Terminus"]).toBeCloseTo(173.25);
});

test("Shadow also scales with AP: + Rabadon's (169 AP) → 30 + 3 + 16.9 = 49.9 per dagger", () => {
  // 49.9 × 0.35 × 15 = 261.975
  expect(run(16, ["Terminus", "Rabadon's Deathcap"]).breakdown.bySource["Terminus"]).toBeCloseTo(261.975);
});
