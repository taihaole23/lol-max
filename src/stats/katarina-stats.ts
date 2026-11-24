// Katarina's stats for a level and a list of items, in the shape the simulation takes.
import { katarina } from "../data/katarina.ts";
import { championLevels, criticalStrike, ultimateRanks } from "../data/game-rules.ts";
import type { Item } from "../data/items.ts";
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import { passivesFor } from "../items/index.ts";
import { statSteps } from "../items/types.ts";
import { statAtLevel } from "../formulas/stats.ts";
import { noShred } from "../formulas/resistance.ts";
import type { RRank } from "../formulas/death-lotus.ts";
import type { Attacker } from "../simulation/simulate.ts";
import { combinePercent } from "./combine.ts";
import { listStat, sumStat } from "./sum-items.ts";

// Everything the simulation needs (the simulation calls this shape `Attacker`).
// `chosenLevel` is the level the user picked; Rod of Ages may raise the level her stats use.
export type KatarinaStats = Attacker;

// `ability` = the ability being cast. A few passives only switch on for one (Hexplate: casting R).
export function katarinaStats(chosenLevel: number, items: Item[], ability: DamageAbilityKey = "r"): KatarinaStats {
  const base = katarina.baseStats;
  const passives = passivesFor(items);

  // Rod of Ages can add a level, but never past the level cap.
  let extraLevels = 0;
  for (const passive of passives) extraLevels += passive.extraLevels ?? 0;
  const level = Math.min(chosenLevel + extraLevels, championLevels.max);

  const baseHealth = statAtLevel(base.health.base, base.health.perLevel, level);
  const baseAd = statAtLevel(base.attackDamage.base, base.attackDamage.perLevel, level);

  const stats: KatarinaStats = {
    level,
    ap: sumStat(items, "abilityPower"),
    apPercentBonus: 0, // item passives add to it; it's applied to `ap` at the very end
    flatMoveSpeed: base.moveSpeed + sumStat(items, "moveSpeed"),
    percentMoveSpeed: sumStat(items, "percentMoveSpeed"),
    // AD from levels is BASE AD, so only items count here.
    bonusAd: sumStat(items, "attackDamage"),
    baseAd,
    critChance: Math.min(sumStat(items, "critChance"), criticalStrike.maxChance),
    // Attack speed from levels is the exception: it counts as BONUS attack speed.
    bonusAttackSpeed: statAtLevel(0, base.attackSpeed.bonusPerLevel, level) + sumStat(items, "attackSpeed"),
    health: baseHealth + sumStat(items, "health"),
    baseHealth,
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

  // Stat-changing item passives run now, after the plain stats are added up,
  // one step at a time in the order of `statSteps` (see src/items/types.ts).
  const context = { level, baseHealth, baseAd, items, ability };
  for (const step of statSteps) {
    for (const passive of passives) {
      if (passive.stats?.step === step) passive.stats.apply(stats, context);
    }
  }

  // % AP bonuses multiply ALL of her AP, including AP from the passives above.
  stats.ap *= 1 + stats.apPercentBonus;

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

// The R ranks Katarina can have at a level: level 8 → [1], level 13 → [1, 2], level 5 → [].
// The site uses it to decide which rank boxes can be clicked.
export function allowedRRanks(level: number): RRank[] {
  const ranks: RRank[] = [];
  for (const rank of [1, 2, 3] as const) {
    if (level >= ultimateRanks.levels[rank - 1]) ranks.push(rank);
  }
  return ranks;
}

// Stops impossible game states, like rank 3 R at level 6. The site disables those rank boxes,
// so this only fires if some code has a bug.
export function checkRRank(level: number, rank: RRank): void {
  const highest = rRankAtLevel(level);
  if (rank > highest) throw new Error(`R rank ${rank} needs a higher level (level ${level} allows up to rank ${highest}).`);
}
