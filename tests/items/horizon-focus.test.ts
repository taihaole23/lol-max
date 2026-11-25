// Horizon Focus and Hexoptics C44: items that only work from a distance, so only for ranged champions.
import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { hexopticsC44 } from "../../src/items/hexoptics-c44.ts";
import { horizonFocus } from "../../src/items/horizon-focus.ts";
import { meleeWielder, type ItemPassive, type Wielder } from "../../src/items/types.ts";
import { abilityCast } from "../../src/simulation/abilities.ts";
import { simulateBuild } from "../../src/simulation/simulate-build.ts";
import { simulateCast } from "../../src/simulation/simulate.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { easyDummy } from "./helpers.ts";

const total = (events: { amount: number }[]) => events.reduce((sum, e) => sum + e.amount, 0);
const ranged: Wielder = { ranged: true, distance: 550 };

// The same cast with and without the item's effect (same stats), so only the passive differs.
function passiveRatio(passive: ItemPassive, wielder: Wielder, champion: "katarina" | "yone" | "lux" | "ezreal", ability: "q" | "r") {
  const attacker = championStats(champion, 18, [getItem(passive.name)], ability);
  const cast = abilityCast(champion, ability, ability === "r" ? 3 : 5, false, attacker);
  const without = total(simulateCast({ cast, attacker, target: easyDummy, items: [] }).events);
  const withIt = total(simulateCast({ cast, attacker, target: easyDummy, items: [passive.createEffect!(wielder)] }).events);
  return withIt / without;
}

test("Horizon Focus: ranged champions get +10% on everything, the first hit included", () => {
  const ap = championStats("lux", 18, [getItem("Horizon Focus")], "r").ap;
  const events = simulateBuild("lux", 18, [getItem("Horizon Focus")], easyDummy, 3, "r").events;
  expect(total(events)).toBeCloseTo(1.1 * (500 + 1.2 * ap), 6);
  expect(passiveRatio(horizonFocus, ranged, "lux", "q")).toBeCloseTo(1.1, 9);
});

test("Horizon Focus: melee champions stand too close (130 units centre to centre)", () => {
  expect(passiveRatio(horizonFocus, meleeWielder, "katarina", "r")).toBe(1);
});

test("Hexoptics C44: Ezreal's Q (basic damage, 550 units away) deals 10% more; his R doesn't", () => {
  expect(passiveRatio(hexopticsC44, ranged, "ezreal", "q")).toBeCloseTo(1.1, 9);
  expect(passiveRatio(hexopticsC44, ranged, "ezreal", "r")).toBe(1);
  // 1% per 50 units: 250 units away = +5%.
  expect(passiveRatio(hexopticsC44, { ranged: true, distance: 250 }, "ezreal", "q")).toBeCloseTo(1.05, 9);
});

test("Hexoptics C44: Yone stands next to the dummy, so 0%", () => {
  expect(passiveRatio(hexopticsC44, meleeWielder, "yone", "q")).toBe(1);
});
