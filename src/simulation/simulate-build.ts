// Simulates one cast for a whole build: Katarina's level, the ability and its rank, and the items
// → her stats and item effects → the hit-by-hit simulation. The optimizer calls this for every build.
import type { Item } from "../data/items.ts";
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import { effectsFor } from "../items/index.ts";
import { checkAbilityRank } from "../stats/ability-ranks.ts";
import { katarinaStats, rRankAtLevel } from "../stats/katarina-stats.ts";
import { abilityCast } from "./abilities.ts";
import { simulateCast, type SimulationResult, type Target } from "./simulate.ts";

// `rank` and `ability` are default parameters: leave them out and it's Death Lotus at the highest
// rank the level allows. The site always passes the ability and rank the user picked.
export function simulateBuild(
  level: number,
  items: Item[],
  target: Target,
  rank: number = rRankAtLevel(level),
  ability: DamageAbilityKey = "r",
): SimulationResult {
  // The rank comes from Katarina's own level, not Rod of Ages' extra level.
  checkAbilityRank(level, ability, rank);
  return simulateCast({
    cast: abilityCast(ability, rank),
    attacker: katarinaStats(level, items, ability),
    target,
    items: effectsFor(items),
  });
}
