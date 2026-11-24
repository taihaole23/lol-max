// Shared setup for the item tests. Not a test file itself (no ".test" in the name).
import { getItem } from "../../src/data/items.ts";
import { simulateDeathLotus, type Attacker, type ItemEffect, type Target } from "../../src/simulation/simulate.ts";
import { noShred } from "../../src/formulas/resistance.ts";
import type { ItemPassive } from "../../src/items/types.ts";
import { simulateBuild } from "../../src/simulation/simulate-build.ts";
import { breakdown } from "../../src/simulation/breakdown.ts";
import type { DamageAbilityKey, PlayableChampionId } from "../../src/data/playable-champions.ts";

// A dummy with no armor or MR, so damage numbers are easy to work out by hand,
// and so much HP that the overkill rule never kicks in.
export const easyDummy: Target = {
  hp: 1_000_000,
  bonusHp: 0,
  baseArmor: 0,
  bonusArmor: 0,
  baseMagicResist: 0,
  bonusMagicResist: 0,
};

// Runs one ult with these items (by name) and returns the events and the breakdown.
export function run(level: number, itemNames: string[], target: Target = easyDummy) {
  const result = simulateBuild("katarina", level, itemNames.map(getItem), target);
  return { ...result, breakdown: breakdown(result.events) };
}

// Runs any champion's ability (Akali's E, say) with these items. Rank = the highest allowed at
// level 18 (Q and E 5, R 3) unless given.
export function runAbility(
  champion: PlayableChampionId,
  ability: DamageAbilityKey,
  itemNames: string[],
  target: Target = easyDummy,
  rank = ability === "r" ? 3 : 5,
) {
  const result = simulateBuild(champion, 18, itemNames.map(getItem), target, rank, ability);
  return { ...result, breakdown: breakdown(result.events) };
}

// For "more damage" items: runs the same ult with and without the item's effect, with
// fixed stats (so the item's own AP etc. can't change anything), and returns each piece
// of damage with its ratio (with ÷ without). `alsoUse` = other effects in both runs.
export const fixedAttacker: Attacker = {
  level: 16,
  ap: 100,
  apPercentBonus: 0,
  flatMoveSpeed: 335,
  percentMoveSpeed: 0,
  bonusAd: 50,
  baseAd: 104.32,
  health: 2000,
  baseHealth: 1500,
  critChance: 0,
  critDamage: 2,
  critDamageModifier: 1,
  bonusAttackSpeed: 0,
  armorShred: noShred,
  magicShred: noShred,
};

export function ampRatios(item: ItemPassive, target: Target = easyDummy, alsoUse: ItemPassive[] = []) {
  const others = () => alsoUse.map((p) => p.createEffect!());
  const simulate = (items: ItemEffect[]) => simulateDeathLotus({ rank: 3, attacker: fixedAttacker, target, items }).events;
  const without = simulate(others());
  // The item's own damage (e.g. Liandry's burn) has nothing to pair with, so it's left out.
  const withItem = simulate([...others(), item.createEffect!()]).filter((e) => e.source !== item.name);
  return withItem.map((event, i) => ({ ...event, ratio: event.amount / without[i].amount }));
}

// Base AD at level 16: 58 + 3.2 × 15 × (0.7025 + 0.0175 × 15) = 104.32
export const baseAdAtLevel16 = 104.32;
