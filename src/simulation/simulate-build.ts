// Simulates one cast for a whole build: the champion, their level, the ability and its rank, and the
// items → their stats and item effects → the hit-by-hit simulation. The optimizer calls this for every build.
//
// Crits (Yone's and Garen's Q): builds are ranked by their PEAK, the best cast they can land
// (Eric). With any crit chance at all that's the crit run; with 0% crit chance Q can never crit,
// so it's the no-crit run. The no-crit number for the card comes from critTotals below.
//
// Sundered Sky: a real basic attack (Garen's Q) always crits, for 80% of the usual crit damage
// (src/items/sundered-sky.ts). Its crit replaces the normal one, so the build's crit chance doesn't
// matter then.
import type { Item } from "../data/items.ts";
import { rangeOf, type DamageAbilityKey, type PlayableChampionId } from "../data/playable-champions.ts";
import { effectsFor } from "../items/index.ts";
import { checkAbilityRank, rRankAtLevel } from "../stats/ability-ranks.ts";
import { championStats } from "../stats/champion-stats.ts";
import { sunderedSky, sunderedSkyData } from "../items/sundered-sky.ts";
import { abilityCanCrit, abilityCast, abilityIsBasicAttack } from "./abilities.ts";
import { simulateCast, type Attacker, type SimulationResult, type Target } from "./simulate.ts";

// For an ability that can crit: the total damage without and with a crit, and the crit chance.
// The site shows both numbers (only one at 0% or 100%); builds are ranked by the peak.
// `guaranteedBy` names the item that makes it always crit (Sundered Sky); `chance` is then 1.
export type CritTotals = { chance: number; noCrit: number; crit: number; guaranteedBy?: string };

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
    items: effectsFor(run.items, rangeOf(run.champion)), // fresh effects for every run: they keep their own stacks
  });
}

// True if Sundered Sky makes this cast's attack crit: the build has it and the ability is a basic attack.
function sunderedSkyCrits(run: Run): boolean {
  return abilityIsBasicAttack(run.champion, run.ability) && run.items.some((i) => i.name === sunderedSky.name);
}

// The same run, with crits shrunk to Sundered Sky's 80% of the usual crit damage (200% → 160%).
function withSunderedSkyCrit(run: Run): Run {
  return { ...run, attacker: { ...run.attacker, critDamage: run.attacker.critDamage * sunderedSkyData.critDamageRatio } };
}

function prepare(
  champion: PlayableChampionId,
  level: number,
  items: Item[],
  target: Target,
  rank: number,
  ability: DamageAbilityKey,
  stacks: number,
): Run {
  // The rank comes from the champion's own level, not Rod of Ages' extra level.
  checkAbilityRank(level, ability, rank);
  return { champion, ability, rank, items, target, attacker: championStats(champion, level, items, ability, stacks) };
}

// `rank` and `ability` are default parameters: leave them out and it's R at the highest
// rank the level allows. The site always passes the ability and rank the user picked.
// `stacks`: the champion's passive stacks (Veigar's Phenomenal Evil), 0 for everyone else.
export function simulateBuild(
  champion: PlayableChampionId,
  level: number,
  items: Item[],
  target: Target,
  rank: number = rRankAtLevel(level),
  ability: DamageAbilityKey = "r",
  stacks = 0,
): SimulationResult {
  const run = prepare(champion, level, items, target, rank, ability, stacks);
  if (sunderedSkyCrits(run)) return runOnce(withSunderedSkyCrit(run), true);
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
  stacks = 0,
): CritTotals | undefined {
  if (!abilityCanCrit(champion, ability)) return undefined;
  const run = prepare(champion, level, items, target, rank, ability, stacks);
  const total = (result: SimulationResult) => result.events.reduce((sum, e) => sum + e.amount, 0);
  if (sunderedSkyCrits(run)) {
    const crit = total(runOnce(withSunderedSkyCrit(run), true));
    return { chance: 1, noCrit: total(runOnce(run, false)), crit, guaranteedBy: sunderedSky.name };
  }
  return { chance: run.attacker.critChance, noCrit: total(runOnce(run, false)), crit: total(runOnce(run, true)) };
}
