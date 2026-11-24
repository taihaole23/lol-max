// Where each icon lives, and a helper to draw an item's icon. The files are saved by
// scripts/update-icons.mjs into public/icons/, which Vite serves at /icons/ on the site.
import type { Item } from "../data/items.ts";
import type { AbilityKey } from "../data/playable-champions.ts";
import { escapeHtml } from "./html.ts";

export const iconPath = {
  champion: (slug: string) => `/icons/champion/${slug}.png`,
  ability: (championSlug: string, key: AbilityKey) => `/icons/ability/${championSlug}-${key}.png`,
  item: (item: Item) => `/icons/item/${item.id}.png`,
  gold: "/icons/ui/gold.png",
  // Splash art, only for champions the site supports (it's big: ~135 KB each).
  splash: (slug: string) => `/icons/splash/${slug}.jpg`,
};

// A gold amount the way the game shows it: the coin, then the number, in gold text.
export function goldHtml(amount: number): string {
  return `<span class="gold-amount"><img src="${iconPath.gold}" alt="" width="18" height="18" />${amount.toLocaleString("en-US")}<span class="visually-hidden"> gold</span></span>`;
}

// An item's icon. Hovering shows the full item card (tooltip.ts reads `data-item-id`); the name is
// also the alt text, for screen readers. Used in the slots, the top 5, the picker, the dummy's items.
export function itemIconHtml(item: Item, size: number, note?: string): string {
  const name = escapeHtml(item.name);
  const noteAttr = note ? ` data-note="${escapeHtml(note)}"` : "";
  return `<span class="item-icon" data-item-id="${item.id}"${noteAttr}><img src="${iconPath.item(item)}" alt="${name}" width="${size}" height="${size}" loading="lazy" /></span>`;
}
