// A playable champion's stats for a level and a list of items, in the shape the simulation takes.
import { championLevels, criticalStrike } from "../data/game-rules.ts";
import type { Item } from "../data/items.ts";
import { playableChampions, type ChampionKit, type DamageAbilityKey, type PlayableChampionId } from "../data/playable-champions.ts";
import { passivesFor } from "../items/index.ts";
import { statSteps } from "../items/types.ts";
import { statAtLevel } from "../formulas/stats.ts";
import { noShred } from "../formulas/resistance.ts";
import type { Attacker } from "../simulation/simulate.ts";
import { combinePercent } from "./combine.ts";
import { listStat, sumStat } from "./sum-items.ts";

// Everything the simulation needs (the simulation calls this shape `Attacker`).
export type ChampionStats = Attacker;

// `chosenLevel` is the level the user picked; Rod of Ages may raise the level her stats use.
// `ability` = the ability being cast. A few passives only switch on for one (Hexplate: casting R).
export function championStats(
  champion: PlayableChampionId,
  chosenLevel: number,
  items: Item[],
  ability: DamageAbilityKey = "r",
): ChampionStats {
  const kit: ChampionKit = playableChampions[champion];
  const base = kit.baseStats;
  const passives = passivesFor(items);

  // Rod of Ages can add a level, but never past the level cap.
  let extraLevels = 0;
  for (const passive of passives) extraLevels += passive.extraLevels ?? 0;
  const level = Math.min(chosenLevel + extraLevels, championLevels.max);

  const baseHealth = statAtLevel(base.health.base, base.health.perLevel, level);
  const baseAd = statAtLevel(base.attackDamage.base, base.attackDamage.perLevel, level);

  const stats: ChampionStats = {
    level,
    ap: sumStat(items, "abilityPower"),
    apPercentBonus: 0, // item passives add to it; it's applied to `ap` at the very end
    flatMoveSpeed: base.moveSpeed + sumStat(items, "moveSpeed"),
    percentMoveSpeed: sumStat(items, "percentMoveSpeed"),
    // AD from levels is BASE AD, so only items count here.
    bonusAd: sumStat(items, "attackDamage"),
    baseAd,
    critChance: Math.min(sumStat(items, "critChance"), criticalStrike.maxChance),
    critDamage: criticalStrike.baseDamage + sumStat(items, "critDamage"), // 2 + Infinity Edge's 0.3
    critDamageModifier: 1,
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

  // A champion passive that changes crits (Yone) runs before the item passives, so its bonus AD
  // counts for them (Swiftmarch's adaptive force compares AD with AP).
  if (kit.critPassive) applyCritPassive(stats, sumStat(items, "critChance"), kit.critPassive);

  // Stat-changing item passives run now, after the plain stats are added up,
  // one step at a time in the order of `statSteps` (see src/items/types.ts).
  const context = { level, baseHealth, baseAd, items, ability, adaptiveWhenTied: kit.adaptiveType.whenTied };
  for (const step of statSteps) {
    for (const passive of passives) {
      if (passive.stats?.step === step) passive.stats.apply(stats, context);
    }
  }

  // % AP bonuses multiply ALL of her AP, including AP from the passives above.
  stats.ap *= 1 + stats.apPercentBonus;

  return stats;
}

// Yone's Way of the Hunter: item crit chance × 2, capped at 100%; every 1% over the cap gives
// 0.5 bonus AD; his crits deal 95% of the usual crit damage.
// e.g. 75% crit from items → 150% → 100% crit chance and +25 bonus AD.
function applyCritPassive(
  stats: ChampionStats,
  itemCritChance: number,
  passive: NonNullable<ChampionKit["critPassive"]>,
): void {
  const doubled = itemCritChance * passive.critChanceMultiplier;
  stats.critChance = Math.min(doubled, criticalStrike.maxChance);
  stats.bonusAd += passive.bonusAdPerExcessCrit * Math.max(0, doubled - criticalStrike.maxChance);
  stats.critDamageModifier = passive.critDamageModifier;
}
