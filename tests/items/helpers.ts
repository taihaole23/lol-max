// Shared setup for the item tests. Not a test file itself (no ".test" in the name).
import { getItem } from "../../src/data/items.ts";
import type { Target } from "../../src/simulation/simulate.ts";
import { simulateBuild } from "../../src/simulation/simulate-build.ts";
import { breakdown } from "../../src/simulation/breakdown.ts";

// A dummy with no armor or MR, so damage numbers are easy to work out by hand,
// and so much HP that the overkill rule never kicks in.
export const easyDummy: Target = {
  hp: 1_000_000,
  baseArmor: 0,
  bonusArmor: 0,
  baseMagicResist: 0,
  bonusMagicResist: 0,
};

// Runs one ult with these items (by name) and returns the events and the breakdown.
export function run(level: number, itemNames: string[], target: Target = easyDummy) {
  const result = simulateBuild(level, itemNames.map(getItem), target);
  return { ...result, breakdown: breakdown(result.events) };
}

// Base AD at level 16: 58 + 3.2 × 15 × (0.7025 + 0.0175 × 15) = 104.32
export const baseAdAtLevel16 = 104.32;
