// The champion's stats as the in-game stat panel shows them (TOTAL values: base + items + passives),
// for the "minimum stats" boxes: "only show builds with at least 150 AD".
//
// Most numbers come straight from championStats, so item passives that change a stat count
// (Rabadon's +30% AP, Riftmaker's HP → AP, Yone's doubled crit chance...). Armor, magic resist and
// ability haste aren't used by the simulation, so they're the champion's base stats + the items' plain stats.
import { attackSpeed } from "../data/game-rules.ts";
import type { Item } from "../data/items.ts";
import { playableChampions, type DamageAbilityKey, type PlayableChampionId } from "../data/playable-champions.ts";
import { statAtLevel } from "../formulas/stats.ts";
import { totalMoveSpeed } from "../formulas/move-speed.ts";
import { championStats } from "./champion-stats.ts";
import { sumStat } from "./sum-items.ts";

export type PanelStat =
  | "health"
  | "armor"
  | "magicResist"
  | "attackDamage"
  | "abilityPower"
  | "attackSpeed"
  | "critChance"
  | "abilityHaste"
  | "moveSpeed";

export type PanelStats = Record<PanelStat, number>;

// Every stat with a minimum box, in the order the page shows them.
//   itemStats: the item stats (Data Dragon names) that can raise it. The item filter keeps items
//              that give one of these when the stat has a minimum (Frozen Heart for armor).
//   shownAs:   the box shows the value × this (crit chance 1 = "100" %).
//   short:     the name on the stat tile, short enough to fit ("MR"); the full label is its tooltip.
//   step:      how much the box's ▲ / ▼ buttons add, in the box's own unit.
export const panelStatInfo: { key: PanelStat; label: string; short: string; itemStats: string[]; shownAs: number; unit: string; step: number }[] = [
  { key: "health", label: "HP", short: "HP", itemStats: ["health"], shownAs: 1, unit: "", step: 100 },
  { key: "armor", label: "Armor", short: "Armor", itemStats: ["armor"], shownAs: 1, unit: "", step: 10 },
  { key: "magicResist", label: "Magic resist", short: "MR", itemStats: ["magicResist"], shownAs: 1, unit: "", step: 10 },
  { key: "attackDamage", label: "AD", short: "AD", itemStats: ["attackDamage"], shownAs: 1, unit: "", step: 10 },
  { key: "abilityPower", label: "AP", short: "AP", itemStats: ["abilityPower"], shownAs: 1, unit: "", step: 10 },
  { key: "attackSpeed", label: "Attack speed", short: "AS", itemStats: ["attackSpeed"], shownAs: 1, unit: "/s", step: 0.1 },
  { key: "critChance", label: "Crit chance", short: "Crit", itemStats: ["critChance"], shownAs: 100, unit: "%", step: 25 },
  { key: "abilityHaste", label: "Ability haste", short: "Haste", itemStats: ["abilityHaste"], shownAs: 1, unit: "", step: 10 },
  { key: "moveSpeed", label: "Move speed", short: "MS", itemStats: ["moveSpeed", "percentMoveSpeed"], shownAs: 1, unit: "", step: 10 },
];

export function panelStats(
  champion: PlayableChampionId,
  level: number,
  items: Item[],
  ability: DamageAbilityKey = "r",
  stacks = 0, // Veigar's passive stacks (championStats)
): PanelStats {
  const stats = championStats(champion, level, items, ability, stacks);
  const base = playableChampions[champion].baseStats;
  return {
    health: stats.health,
    // stats.level, not `level`: Rod of Ages' extra level raises these too.
    armor: statAtLevel(base.armor.base, base.armor.perLevel, stats.level) + sumStat(items, "armor"),
    magicResist: statAtLevel(base.magicResist.base, base.magicResist.perLevel, stats.level) + sumStat(items, "magicResist"),
    attackDamage: stats.baseAd + stats.bonusAd,
    abilityPower: stats.ap,
    // Total attack speed = base × (1 + bonus attack speed), up to the cap.
    attackSpeed: Math.min(base.attackSpeed.base * (1 + stats.bonusAttackSpeed), attackSpeed.cap),
    critChance: stats.critChance,
    abilityHaste: sumStat(items, "abilityHaste"),
    moveSpeed: totalMoveSpeed(stats.flatMoveSpeed, stats.percentMoveSpeed),
  };
}

// The minimums the user typed. A stat that isn't listed has no minimum.
export type MinStats = Partial<Record<PanelStat, number>>;

// True if every stat is at least its minimum. A tiny tolerance, so "100% crit" isn't missed
// because 0.25 × 4 came out as 0.9999999 in floating point.
export function meetsMinimums(stats: PanelStats, minimums: MinStats): boolean {
  for (const [stat, min] of Object.entries(minimums) as [PanelStat, number][]) {
    if (stats[stat] < min - 1e-9) return false;
  }
  return true;
}

// The stats that have a minimum, e.g. ["abilityPower", "attackDamage"].
export const statsWithMinimum = (minimums: MinStats) => Object.keys(minimums) as PanelStat[];

// The item stats that can raise those (move speed: flat and %), for the item filter.
export const itemStatsFor = (minimums: MinStats) =>
  panelStatInfo.filter((info) => info.key in minimums).flatMap((info) => info.itemStats);
