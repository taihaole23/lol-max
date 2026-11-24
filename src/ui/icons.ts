// Where each icon lives, and a helper to draw an item's icon. The files are saved by
// scripts/update-icons.mjs into public/icons/, which Vite serves at /icons/ on the site.
import type { Item } from "../data/items.ts";
import type { AbilityKey } from "../data/playable-champions.ts";
import { escapeHtml } from "./html.ts";

export const iconPath = {
  champion: (slug: string) => `/icons/champion/${slug}.png`,
  ability: (championSlug: string, key: AbilityKey) => `/icons/ability/${championSlug}-${key}.png`,
  item: (item: Item) => `/icons/item/${item.id}.png`,
};

// An item's icon with its name on hover (`data-tip`, styled in style.css) and as alt text for
// screen readers. Used in the slots, the top 5 and the dummy's items.
export function itemIconHtml(item: Item, size: number): string {
  const name = escapeHtml(item.name);
  return `<span class="item-icon" data-tip="${name}"><img src="${iconPath.item(item)}" alt="${name}" width="${size}" height="${size}" loading="lazy" /></span>`;
}
