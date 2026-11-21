// The item snapshot, made by scripts/update-items.mjs from Riot's Data Dragon.
// Never edit the .json by hand: change the script and run it again.
// When the patch changes, re-run the script and update the file name below.
import snapshot from "./items.26.23.json";

// "legendary": completed items Katarina can buy.
// "boots" / "boots-tier-3": tier-2 boots, and their upgrades from the mid role quest.
// "support": support item upgrades (Dream Maker...). Only used for the dummy.
export type ItemCategory = "legendary" | "boots" | "boots-tier-3" | "support";

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  gold: number;
  // e.g. { abilityPower: 95, percentMagicPenetration: 0.4 }. Stats an item doesn't have are left out,
  // which is what `Partial` says: any stat may be missing.
  stats: Partial<Record<string, number>>;
};

export const itemSource = { url: snapshot.source, patch: snapshot.patch };

export const items = snapshot.items as Item[];

// Looks an item up by its exact name. Throws an error if there's no such item,
// so a typo is caught right away instead of quietly counting as "no stats".
export function getItem(name: string): Item {
  const item = items.find((i) => i.name === name);
  if (!item) throw new Error(`No item named "${name}" in the item snapshot.`);
  return item;
}
