// The target dummy's stats: a champion at a level, plus the plain stats of its items.
// Item passives and champion abilities are ignored (see CLAUDE.md).
import { champions, type ChampionId } from "../data/champions.ts";
import { dummyPresets, type EnemyType } from "../data/dummy-presets.ts";
import { stages, type StageName } from "../data/stages.ts";
import { getItem, type Item } from "../data/items.ts";
import { statAtLevel } from "../formulas/stats.ts";
import type { Target } from "../simulation/simulate.ts";
import { sumStat } from "./sum-items.ts";

export function dummyStats(championId: ChampionId, level: number, items: Item[]): Target {
  const champion = champions[championId];
  return {
    hp: statAtLevel(champion.health.base, champion.health.perLevel, level) + sumStat(items, "health"),
    // Typed-in numbers are applied afterwards, by withTypedStats below.
    bonusHp: sumStat(items, "health"),
    // Base (champion + levels) and bonus (items) stay separate: penetration treats them differently.
    baseArmor: statAtLevel(champion.armor.base, champion.armor.perLevel, level),
    bonusArmor: sumStat(items, "armor"),
    baseMagicResist: statAtLevel(champion.magicResist.base, champion.magicResist.perLevel, level),
    bonusMagicResist: sumStat(items, "magicResist"),
  };
}

// Numbers the user typed into the dummy's boxes. `null` = not typed, use the calculated number.
export type TypedStats = { hp: number | null; armor: number | null; magicResist: number | null };

// Puts typed-in numbers on top of the calculated dummy (Eric, Step 7).
// The typed number is the new TOTAL. It's split into base and bonus because penetration
// treats them differently:
//   - base stays the champion's own value, and bonus = typed − base;
//   - typed below the champion's base: base = typed, bonus = 0.
// HP works the same way: bonus HP (for Lord Dominik's) = typed − the champion's own HP, at least 0.
export function withTypedStats(calculated: Target, typed: TypedStats): Target {
  const result = { ...calculated };
  if (typed.hp !== null) {
    const championHp = calculated.hp - calculated.bonusHp;
    result.hp = typed.hp;
    result.bonusHp = Math.max(0, typed.hp - championHp);
  }
  if (typed.armor !== null) {
    result.baseArmor = Math.min(calculated.baseArmor, typed.armor);
    result.bonusArmor = typed.armor - result.baseArmor;
  }
  if (typed.magicResist !== null) {
    result.baseMagicResist = Math.min(calculated.baseMagicResist, typed.magicResist);
    result.bonusMagicResist = typed.magicResist - result.baseMagicResist;
  }
  return result;
}

// The "Use recommended items" list for an enemy type and stage: boots + the first N items.
export function recommendedDummyItems(enemyType: EnemyType, stage: StageName): Item[] {
  const preset = dummyPresets[enemyType];
  const count = stages[stage].itemsWithBoots;
  const names = [preset.boots, ...preset.itemsInBuyOrder.slice(0, count)];
  return names.map(getItem);
}
