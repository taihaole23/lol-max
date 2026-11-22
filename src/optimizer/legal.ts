// Rules for which items may share a build. The optimizer (Step 6) uses these to skip illegal builds.
import { itemGroups } from "../data/item-groups.ts";

// True if the two items may be in the same build: they are different items
// and no item group contains both of them.
export function canBeBuiltTogether(itemA: string, itemB: string): boolean {
  if (itemA === itemB) return false; // no duplicates

  for (const members of Object.values(itemGroups.groups)) {
    if (members.includes(itemA) && members.includes(itemB)) return false;
  }
  return true;
}
