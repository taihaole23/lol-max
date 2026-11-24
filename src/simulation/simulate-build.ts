// Simulates one cast for a whole build: the champion, their level, the ability and its rank, and the
// items → their stats and item effects → the hit-by-hit simulation. The optimizer calls this for every build.
import type { Item } from "../data/items.ts";
import type { DamageAbilityKey, PlayableChampionId } from "../data/playable-champions.ts";
import { effectsFor } from "../items/index.ts";
import { checkAbilityRank, rRankAtLevel } from "../stats/ability-ranks.ts";
import { championStats } from "../stats/champion-stats.ts";
import { abilityCast } from "./abilities.ts";
import { simulateCast, type SimulationResult, type Target } from "./simulate.ts";

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
  // The rank comes from the champion's own level, not Rod of Ages' extra level.
  checkAbilityRank(level, ability, rank);
  return simulateCast({
    cast: abilityCast(champion, ability, rank),
    attacker: championStats(champion, level, items, ability),
    target,
    items: effectsFor(items),
  });
}
