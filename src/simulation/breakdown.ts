// Adds up a list of damage events in the different ways the site shows them.
// Every view comes from the same events, so they always agree on the total.
import type { DamageEvent } from "./simulate.ts";

export type Breakdown = {
  total: number;
  bySource: Record<string, number>; // "base", "apRatio", "bonusAdRatio", item names
  byType: { magic: number; physical: number; true: number };
  ability: number; // the daggers themselves
  items: number; // everything from item effects
};

export function breakdown(events: DamageEvent[]): Breakdown {
  const result: Breakdown = {
    total: 0,
    bySource: {},
    byType: { magic: 0, physical: 0, true: 0 },
    ability: 0,
    items: 0,
  };

  for (const event of events) {
    result.total += event.amount;
    result.bySource[event.source] = (result.bySource[event.source] ?? 0) + event.amount;
    result.byType[event.type] += event.amount;
    if (event.fromItem) {
      result.items += event.amount;
    } else {
      result.ability += event.amount;
    }
  }

  return result;
}
