// Simulates one cast for a whole build: the champion, their level, the ability and its rank, and the
// items → their stats and item effects → the hit-by-hit simulation. The optimizer calls this for every build.
//
// Crits (Yone's and Garen's Q): builds are ranked by their PEAK, the best cast they can land
// (Eric). With any crit chance at all that's the crit run; with 0% crit chance Q can never crit,
// so it's the no-crit run. The no-crit number for the card comes from critTotals below.
import type { Item } from "../data/items.ts";
import type { DamageAbilityKey, PlayableChampionId } from "../data/playable-champions.ts";
import { effectsFor } from "../items/index.ts";
import { checkAbilityRank, rRankAtLevel } from "../stats/ability-ranks.ts";
import { championStats } from "../stats/champion-stats.ts";
import { abilityCanCrit, abilityCast } from "./abilities.ts";
import { simulateCast, type Attacker, type SimulationResult, type Target } from "./simulate.ts";

// For an ability that can crit: the total damage without and with a crit, and the crit chance.
// The site shows both numbers (only one at 0% or 100%); builds are ranked by the peak.
export type CritTotals = { chance: number; noCrit: number; crit: number };

type Run = {
  champion: PlayableChampionId;
  ability: DamageAbilityKey;
  rank: number;
  attacker: Attacker;
  items: Item[];
  target: Target;
};

function runOnce(run: Run, crit: boolean): SimulationResult {
  return simulateCast({
    cast: abilityCast(run.champion, run.ability, run.rank, crit, run.attacker),
    attacker: run.attacker,
    target: run.target,
    items: effectsFor(run.items), // fresh effects for every run: they keep their own stacks
  });
}

function prepare(
  champion: PlayableChampionId,
  level: number,
  items: Item[],
  target: Target,
  rank: number,
  ability: DamageAbilityKey,
): Run {
  // The rank comes from the champion's own level, not Rod of Ages' extra level.
  checkAbilityRank(level, ability, rank);
  return { champion, ability, rank, items, target, attacker: championStats(champion, level, items, ability) };
}

// `rank` and `ability` are default parameters: leave them out and it's R at the highest
// rank the level allows. The site always passes the ability and rank the user picked.
export function simulateBuild(
  champion: PlayableChampionId,
  level: number,
  items: Item[],
  target: Target,
  rank: number = rRankAtLevel(level),
  ability: DamageAbilityKey = "r",
): SimulationResult {
  const run = prepare(champion, level, items, target, rank, ability);
  const chance = abilityCanCrit(champion, ability) ? run.attacker.critChance : 0;
  // The peak: a crit if the build can crit at all, otherwise the normal cast.
  return runOnce(run, chance > 0);
}

// Total damage without and with a crit, for an ability that can crit. undefined for the others.
export function critTotals(
  champion: PlayableChampionId,
  level: number,
  items: Item[],
  target: Target,
  rank: number = rRankAtLevel(level),
  ability: DamageAbilityKey = "r",
): CritTotals | undefined {
  if (!abilityCanCrit(champion, ability)) return undefined;
  const run = prepare(champion, level, items, target, rank, ability);
  const total = (result: SimulationResult) => result.events.reduce((sum, e) => sum + e.amount, 0);
  return { chance: run.attacker.critChance, noCrit: total(runOnce(run, false)), crit: total(runOnce(run, true)) };
}
