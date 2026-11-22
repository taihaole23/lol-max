// Simulates one ult for a whole build: stage level + items → Katarina's stats and
// item effects → the dagger-by-dagger simulation. The optimizer (Step 6) calls this for every build.
import type { Item } from "../data/items.ts";
import { effectsFor } from "../items/index.ts";
import { katarinaStats, rRankAtLevel } from "../stats/katarina-stats.ts";
import { simulateDeathLotus, type SimulationResult, type Target } from "./simulate.ts";

export function simulateBuild(stageLevel: number, items: Item[], target: Target): SimulationResult {
  return simulateDeathLotus({
    // R's rank comes from the stage's level, not Rod of Ages' extra level.
    rank: rRankAtLevel(stageLevel),
    attacker: katarinaStats(stageLevel, items),
    target,
    items: effectsFor(items),
  });
}
