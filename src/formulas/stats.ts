// A champion's stat at a given level, from its base value and per-level growth.
import { statGrowth } from "../data/game-rules.ts";

export function statAtLevel(base: number, growth: number, level: number): number {
  const levelsGained = level - 1;
  return base + growth * levelsGained * (statGrowth.constant + statGrowth.perLevel * levelsGained);
}

