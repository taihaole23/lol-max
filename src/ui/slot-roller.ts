// The "casino" roll (Eric): while Optimize searches, every free item slot flicks through random
// item icons. When the answer arrives, the slots stop one by one, left to right, each landing
// on its real item with a little bounce. Then the page shows the damage and the top 5.
//
// How: a rolling slot is drawn as `<div class="slot rolling" data-pool="items|boots">` holding one
// <img>. A timer swaps that image's picture every `flickMs`. A slot that should stop also carries
// `data-land-at` (a time) and `data-final` (its real icon): once that time passes, the timer puts
// the real icon in and swaps the "rolling" class for "landed" (the bounce, in style.css).
// It's decoration only: the answer is already worked out before the first slot stops.
import type { Item } from "../data/items.ts";
import { escapeHtml } from "./html.ts";
import { iconPath } from "./icons.ts";

const flickMs = 70; // a new random icon this often
export const landGapMs = 170; // time between two slots stopping

// Only icons that have finished loading are rolled: swapping to a picture that isn't loaded yet
// shows an empty slot, and at a new picture every 70 ms it would never catch up.
let pools: Record<"items" | "boots", string[]> = { items: [], boots: [] };
let timer: ReturnType<typeof setInterval> | undefined;
let onAllLanded: () => void = () => {};
const loaded = new Set<string>();
const keepAlive: HTMLImageElement[] = []; // so the loading pictures aren't thrown away early

// The icons to roll through, loaded once up front.
export function setRollPools(items: Item[], boots: Item[]): void {
  pools = { items: items.map(iconPath.item), boots: boots.map(iconPath.item) };
  for (const src of [...pools.items, ...pools.boots]) {
    if (loaded.has(src)) continue;
    const img = new Image();
    img.onload = () => loaded.add(src);
    img.src = src;
    keepAlive.push(img);
  }
}

// People whose system asks for less motion see the plain slots instead.
export const rollingAllowed = () => !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const randomFrom = (list: string[]) => {
  const ready = list.filter((src) => loaded.has(src));
  const from = ready.length ? ready : list;
  return from[Math.floor(Math.random() * from.length)] ?? "";
};

// One rolling slot. With `land`, it stops on `land.item` at time `land.at` (performance.now()).
export function rollingSlotHtml(pool: "items" | "boots", label: string, land?: { item: Item; at: number }): string {
  const landAttrs = land ? ` data-land-at="${land.at}" data-final="${iconPath.item(land.item)}" data-final-name="${escapeHtml(land.item.name)}"` : "";
  // The first picture is always the same, so redrawing gives identical HTML and the page can skip
  // it (see champion-page.ts); the timer picks random ones from then on.
  return `<div class="slot-wrap"><div class="slot filled rolling" data-pool="${pool}"${landAttrs} role="img" aria-label="${escapeHtml(label)}: rolling">
    <img src="${pools[pool][0] ?? ""}" alt="" width="56" height="56" /></div></div>`;
}

// Starts the timer if it isn't running. `whenLanded` runs once, after the last slot with a stop
// time has landed (and its bounce had time to play).
export function startRolling(whenLanded: () => void = () => {}): void {
  onAllLanded = whenLanded;
  if (timer !== undefined) return;
  timer = setInterval(tick, flickMs);
}

export function stopRolling(): void {
  clearInterval(timer);
  timer = undefined;
}

function tick(): void {
  const slots = document.querySelectorAll<HTMLElement>(".slot.rolling");
  if (slots.length === 0) return stopRolling();
  const now = performance.now();
  let waitingToLand = false;
  for (const slot of slots) {
    const img = slot.querySelector("img");
    if (!img) continue;
    const landAt = Number(slot.dataset.landAt);
    if (slot.dataset.landAt && now >= landAt) {
      img.src = slot.dataset.final ?? "";
      img.alt = slot.dataset.finalName ?? "";
      slot.classList.replace("rolling", "landed");
      continue;
    }
    if (slot.dataset.landAt) waitingToLand = true;
    img.src = randomFrom(pools[slot.dataset.pool === "boots" ? "boots" : "items"]);
  }
  // Every slot that had a stop time has landed: let the bounce finish, then hand over.
  const anyLanding = document.querySelector(".slot.rolling[data-land-at]") !== null;
  if (!waitingToLand && !anyLanding && document.querySelector(".slot.landed")) {
    stopRolling();
    const done = onAllLanded;
    onAllLanded = () => {};
    setTimeout(done, 280);
  }
}
