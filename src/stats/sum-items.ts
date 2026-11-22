// Small helpers for adding up one stat across a list of items.
import type { Item } from "../data/items.ts";

// The total of one stat, e.g. sumStat(items, "abilityPower"). Items without it count as 0.
// `readonly` means the function promises not to change the list.
export function sumStat(items: readonly Item[], stat: string): number {
  let total = 0;
  for (const item of items) {
    total += item.stats[stat] ?? 0;
  }
  return total;
}

// Every value of one stat, for stats that multiply instead of adding (see combinePercent).
export function listStat(items: Item[], stat: string): number[] {
  return items.map((item) => item.stats[stat] ?? 0);
}
