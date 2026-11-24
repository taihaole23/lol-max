// Which items the optimizer may put in a build (the same for every playable champion: all are melee).
import { items, type Item } from "../data/items.ts";
import { meleeCannotBuy } from "../data/item-groups.ts";
import { itemPassives } from "../items/index.ts";

// Every plain item stat that our code reads for a champion (see src/stats/champion-stats.ts).
// If you make the code read a new stat, add it here, or the filter could wrongly remove an item.
// (A test checks every removed item really changes nothing.)
export const statsReadByCode = [
  "abilityPower",
  "attackDamage",
  "attackSpeed",
  "critChance",
  "health", // Riftmaker turns HP into AP, so every HP item counts
  "lethality",
  "percentArmorPenetration",
  "flatMagicPenetration",
  "percentMagicPenetration",
  "moveSpeed", // Swiftmarch turns move speed into AP / AD
  "percentMoveSpeed",
];

// The item filter: an item is kept if it has a hand-coded passive or any stat our code reads.
export function canChangeDamage(item: Item): boolean {
  if (itemPassives.some((passive) => passive.name === item.name)) return true;
  return statsReadByCode.some((stat) => (item.stats[stat] ?? 0) !== 0);
}

export type ItemPool = {
  legendaries: Item[]; // the items the search tries
  removedByFilter: Item[]; // shown on the site
};

// `useFilter: false` is only for the test that checks the filter changes nothing.
export function legendaryPool(useFilter = true): ItemPool {
  const buyable = items.filter((item) => item.category === "legendary" && !meleeCannotBuy.items.includes(item.name));
  if (!useFilter) return { legendaries: buyable, removedByFilter: [] };
  return {
    legendaries: buyable.filter(canChangeDamage),
    removedByFilter: buyable.filter((item) => !canChangeDamage(item)),
  };
}

// Boots on: tier-2 boots, or tier-3 with the mid quest. Boots off: none.
export type BootsSetting = "off" | "tier2" | "tier3";

export function bootsPool(setting: BootsSetting): Item[] {
  if (setting === "off") return [];
  const category = setting === "tier2" ? "boots" : "boots-tier-3";
  return items.filter((item) => item.category === category);
}
