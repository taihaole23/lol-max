// Where each icon lives. The files are saved by scripts/update-icons.mjs into public/icons/,
// which Vite serves at /icons/ on the site.
import type { Item } from "../data/items.ts";
import type { AbilityKey } from "../data/playable-champions.ts";

export const iconPath = {
  champion: (slug: string) => `/icons/champion/${slug}.png`,
  ability: (championSlug: string, key: AbilityKey) => `/icons/ability/${championSlug}-${key}.png`,
  item: (item: Item) => `/icons/item/${item.id}.png`,
};
