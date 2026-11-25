// Which items the optimizer may put in a build. The same for every champion, except that only ranged
// champions can buy ranged-only items (Runaan's Hurricane).
import { items, type Item } from "../data/items.ts";
import { rangeOf, type PlayableChampionId } from "../data/playable-champions.ts";
import { meleeCannotBuy } from "../data/item-groups.ts";
import { itemPassives } from "../items/index.ts";

// Every plain item stat that our code reads for a champion (see src/stats/champion-stats.ts).
// If you make the code read a new stat, add it here, or the filter could wrongly remove an item.
// (A test checks every removed item really changes nothing.)
export const statsReadByCode = [
  "abilityPower",
  "attackDamage",
  "attackSpeed",
  "critChance", // Yone's Q crits (and his passive turns extra crit into AD); Essence Reaver
  "critDamage", // Infinity Edge: bigger crits on Yone's Q
  "health", // Riftmaker turns HP into AP, so every HP item counts
  "lethality",
  "percentArmorPenetration",
  "flatMagicPenetration",
  "percentMagicPenetration",
  "moveSpeed", // Swiftmarch turns move speed into AP / AD
  "percentMoveSpeed",
];

// The item filter: an item is kept if it has a hand-coded passive or any stat our code reads.
// `extraStats`: stats the user set a minimum for (armor...). Items that give one are kept too:
// they add no damage, but they can be what gets a build to the minimum.
export function canChangeDamage(item: Item, extraStats: readonly string[] = []): boolean {
  if (itemPassives.some((passive) => passive.name === item.name)) return true;
  return [...statsReadByCode, ...extraStats].some((stat) => (item.stats[stat] ?? 0) !== 0);
}

export type ItemPool = {
  legendaries: Item[]; // the items the search tries
  removedByFilter: Item[]; // shown on the site
};

// `useFilter: false` is only for the test that checks the filter changes nothing.
// `extraStats`: see canChangeDamage. `champion`: whose build it is (left out = a melee champion).
export function legendaryPool(useFilter = true, extraStats: readonly string[] = [], champion?: PlayableChampionId): ItemPool {
  const ranged = champion !== undefined && rangeOf(champion).ranged;
  const buyable = items.filter((item) => item.category === "legendary" && (ranged || !meleeCannotBuy.items.includes(item.name)));
  if (!useFilter) return { legendaries: buyable, removedByFilter: [] };
  return {
    legendaries: buyable.filter((item) => canChangeDamage(item, extraStats)),
    removedByFilter: buyable.filter((item) => !canChangeDamage(item, extraStats)),
  };
}

// Boots on: tier-2 boots, or tier-3 with the mid quest. Boots off: none.
export type BootsSetting = "off" | "tier2" | "tier3";

export function bootsPool(setting: BootsSetting): Item[] {
  if (setting === "off") return [];
  const category = setting === "tier2" ? "boots" : "boots-tier-3";
  return items.filter((item) => item.category === category);
}
