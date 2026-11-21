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
    // Base (champion + levels) and bonus (items) stay separate: penetration treats them differently.
    baseArmor: statAtLevel(champion.armor.base, champion.armor.perLevel, level),
    bonusArmor: sumStat(items, "armor"),
    baseMagicResist: statAtLevel(champion.magicResist.base, champion.magicResist.perLevel, level),
    bonusMagicResist: sumStat(items, "magicResist"),
  };
}

// The "Use recommended items" list for an enemy type and stage: boots + the first N items.
export function recommendedDummyItems(enemyType: EnemyType, stage: StageName): Item[] {
  const preset = dummyPresets[enemyType];
  const count = stages[stage].itemsWithBoots;
  const names = [preset.boots, ...preset.itemsInBuyOrder.slice(0, count)];
  return names.map(getItem);
}
