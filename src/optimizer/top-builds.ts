// Keeps the best N builds seen so far, best first. Used for the final top 5 and for the beam.
import type { Item } from "../data/items.ts";

export type FoundBuild = {
  items: Item[]; // legendaries in item-pool order, then boots (if any)
  damage: number; // total damage of one cast
  gold: number; // total cost, used to break ties
};

// True if build `a` should rank above build `b`: more damage wins; on a tie, the cheaper build;
// on a tie again, the names in alphabetical order, so the result never depends on search order.
export function ranksAbove(a: FoundBuild, b: FoundBuild): boolean {
  if (a.damage !== b.damage) return a.damage > b.damage;
  if (a.gold !== b.gold) return a.gold < b.gold;
  return buildKey(a) < buildKey(b);
}

// Puts `build` in its place in `list` (sorted best first) and drops anything past `size`.
export function keepTop(list: FoundBuild[], build: FoundBuild, size: number): void {
  // Full and not better than the worst one: nothing to do (this is the common case, so it's checked first).
  if (list.length === size && !ranksAbove(build, list[size - 1])) return;

  let place = list.length;
  while (place > 0 && ranksAbove(build, list[place - 1])) place--;
  list.splice(place, 0, build);
  if (list.length > size) list.pop();
}

// A text name for a build, e.g. "Rabadon's Deathcap + Sorcerer's Shoes".
export function buildKey(build: FoundBuild): string {
  return build.items.map((item) => item.name).join(" + ");
}
