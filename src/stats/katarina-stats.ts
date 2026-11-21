// Katarina's stats for a level and a list of items, in the shape the simulation takes.
import { katarina } from "../data/katarina.ts";
import { ultimateRanks } from "../data/game-rules.ts";
import type { Item } from "../data/items.ts";
import { statAtLevel } from "../formulas/stats.ts";
import { noShred } from "../formulas/resistance.ts";
import type { RRank } from "../formulas/death-lotus.ts";
import type { Attacker } from "../simulation/simulate.ts";
import { combinePercent } from "./combine.ts";
import { listStat, sumStat } from "./sum-items.ts";

// Everything the simulation needs, plus HP for items that turn HP into other stats (Step 5d).
export type KatarinaStats = Attacker & { health: number };

export function katarinaStats(level: number, items: Item[]): KatarinaStats {
  const base = katarina.baseStats;

  const stats: KatarinaStats = {
    ap: sumStat(items, "abilityPower"),
    // AD from levels is BASE AD, so only items count here.
    bonusAd: sumStat(items, "attackDamage"),
    // Attack speed from levels is the exception: it counts as BONUS attack speed.
    bonusAttackSpeed: statAtLevel(0, base.attackSpeed.bonusPerLevel, level) + sumStat(items, "attackSpeed"),
    health: statAtLevel(base.health.base, base.health.perLevel, level) + sumStat(items, "health"),
    armorShred: {
      ...noShred,
      percentPenetration: combinePercent(listStat(items, "percentArmorPenetration")),
      flatPenetration: sumStat(items, "lethality"), // lethality = flat armor pen, 1:1
    },
    magicShred: {
      ...noShred,
      percentPenetration: combinePercent(listStat(items, "percentMagicPenetration")),
      flatPenetration: sumStat(items, "flatMagicPenetration"),
    },
  };

  // Step 5d: stat-changing item passives (like Rabadon's "+X% AP") will run here,
  // after the plain stats are added up.

  return stats;
}

// The highest R rank Katarina can have at a level: 6-10 → 1, 11-15 → 2, 16+ → 3.
export function rRankAtLevel(level: number): RRank {
  const [rank1, rank2, rank3] = ultimateRanks.levels;
  if (level >= rank3) return 3;
  if (level >= rank2) return 2;
  if (level >= rank1) return 1;
  throw new Error(`Katarina has no R before level ${rank1} (got level ${level}).`);
}
