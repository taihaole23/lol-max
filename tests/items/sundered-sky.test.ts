// Sundered Sky: Garen's Q (a real basic attack) always crits, for 80% of his total crit damage.
import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { critTotals, simulateBuild } from "../../src/simulation/simulate-build.ts";
import type { Target } from "../../src/simulation/simulate.ts";
import { championStats } from "../../src/stats/champion-stats.ts";

// No armor, and so much HP that the overkill rule never kicks in.
const bigDummy: Target = { hp: 1_000_000, bonusHp: 0, baseArmor: 0, bonusArmor: 0, baseMagicResist: 0, bonusMagicResist: 0 };
const items = (...names: string[]) => names.map(getItem);
const total = (events: { amount: number }[]) => events.reduce((sum, e) => sum + e.amount, 0);
const totalAd = (names: string[]) => {
  const a = championStats("garen", 18, items(...names), "q");
  return a.baseAd + a.bonusAd;
};

test("Garen Q with Sundered Sky: always crits, the attack deals 160% (0.8 × 200%)", () => {
  const crit = critTotals("garen", 18, items("Sundered Sky"), bigDummy, 5, "q")!;
  expect(crit.chance).toBe(1); // 0% crit chance from items, but it crits anyway
  expect(crit.guaranteedBy).toBe("Sundered Sky");
  // The crit adds 60% of the attack (100% AD) on top of the no-crit cast.
  expect(crit.crit - crit.noCrit).toBeCloseTo(0.6 * totalAd(["Sundered Sky"]), 6);
});

test("with Infinity Edge: 0.8 × 230% = 184%, the wiki's '60% + IE 24% bonus damage'", () => {
  const build = ["Sundered Sky", "Infinity Edge"];
  const crit = critTotals("garen", 18, items(...build), bigDummy, 5, "q")!;
  expect(crit.crit - crit.noCrit).toBeCloseTo(0.84 * totalAd(build), 6);
});

test("the build's damage (what the optimizer ranks) is the Sundered Sky crit", () => {
  const build = items("Sundered Sky");
  const crit = critTotals("garen", 18, build, bigDummy, 5, "q")!;
  expect(total(simulateBuild("garen", 18, build, bigDummy, 5, "q").events)).toBeCloseTo(crit.crit, 6);
});

test("does nothing for Yone's Q: basic damage, but not a basic attack", () => {
  const withSky = critTotals("yone", 18, items("Sundered Sky"), bigDummy, 5, "q")!;
  expect(withSky.guaranteedBy).toBeUndefined();
  expect(withSky.chance).toBe(0);
});

test("does nothing for Garen's E (spins aren't attacks)", () => {
  expect(critTotals("garen", 18, items("Sundered Sky"), bigDummy, 5, "e")).toBeUndefined();
});
