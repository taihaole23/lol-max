// Adds up a list of damage events in the different ways the site shows them.
// Every view comes from the same events, so they always agree on the total.
import type { DamageEvent } from "./simulate.ts";

export type Breakdown = {
  total: number;
  bySource: Record<string, number>; // "base", "apRatio", "adRatio", "bonusAdRatio", item names
  byType: { magic: number; physical: number; true: number };
  // The damage types each source dealt (so the page can colour "AP ratio" as magic, etc.).
  typesBySource: Record<string, DamageEvent["type"][]>;
  ability: number; // the ability's own hits (the daggers, for R)
  items: number; // everything from item effects
  // The ability's own damage per named hit (Akali's E and R: "First cast", "Recast"), in the order
  // the hits first dealt damage. Empty when the hits have no names (Katarina).
  byHit: Record<string, number>;
};

export function breakdown(events: DamageEvent[]): Breakdown {
  const result: Breakdown = {
    total: 0,
    bySource: {},
    byType: { magic: 0, physical: 0, true: 0 },
    typesBySource: {},
    ability: 0,
    items: 0,
    byHit: {},
  };

  for (const event of events) {
    result.total += event.amount;
    result.bySource[event.source] = (result.bySource[event.source] ?? 0) + event.amount;
    result.byType[event.type] += event.amount;
    const types = (result.typesBySource[event.source] ??= []);
    if (!types.includes(event.type)) types.push(event.type);
    if (event.fromItem) {
      result.items += event.amount;
    } else {
      result.ability += event.amount;
      if (event.hitName) result.byHit[event.hitName] = (result.byHit[event.hitName] ?? 0) + event.amount;
    }
  }

  return result;
}
