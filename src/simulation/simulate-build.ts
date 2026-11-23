// Simulates one ult for a whole build: Katarina's level, R rank and items → her stats and
// item effects → the dagger-by-dagger simulation. The optimizer (Step 6) calls this for every build.
import type { Item } from "../data/items.ts";
import type { RRank } from "../formulas/death-lotus.ts";
import { effectsFor } from "../items/index.ts";
import { checkRRank, katarinaStats, rRankAtLevel } from "../stats/katarina-stats.ts";
import { simulateDeathLotus, type SimulationResult, type Target } from "./simulate.ts";

// `rank` is a default parameter: leave it out and it's the highest rank the level allows.
// The site always passes the rank the user picked.
export function simulateBuild(level: number, items: Item[], target: Target, rank: RRank = rRankAtLevel(level)): SimulationResult {
  checkRRank(level, rank);
  return simulateDeathLotus({
    // R's rank comes from Katarina's own level, not Rod of Ages' extra level.
    rank,
    attacker: katarinaStats(level, items),
    target,
    items: effectsFor(items),
  });
}
