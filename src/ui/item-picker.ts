// The item picker: a panel that opens when you click an item slot.
//   - If the slot shows a result item: "Lock this item" or "Ban it" (never use it again).
//   - If the slot is locked: "Unlock".
//   - Below: a searchable grid of items to lock into the slot. Items that can't go there right now
//     (already locked elsewhere, or clash with a locked item) are greyed out; hovering says why.
// The dummy's item slots use it too (`forDummy`): pick an item, or remove the one there.
// Only one picker is open at a time. Escape, clicking outside or picking closes it.
import type { Item } from "../data/items.ts";
import { escapeHtml } from "./html.ts";
import { itemIconHtml } from "./icons.ts";

export type PickerOptions = {
  anchor: HTMLElement; // the slot that was clicked
  title: string;
  items: Item[]; // what can go in this slot
  unavailable: Map<string, string>; // item name → why it can't be picked now
  current: { item: Item; locked: boolean } | null;
  onLock: (name: string) => void;
  onUnlock: () => void;
  onBan: (name: string) => void;
  // The dummy's slots use the same picker, but there's nothing to lock or ban: the slot's item
  // can only be removed, and picking an item just puts it in.
  forDummy?: boolean;
};

let closeOpenPicker: (() => void) | null = null;

export function closeItemPicker(): void {
  closeOpenPicker?.();
}

const simplify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

export function openItemPicker(o: PickerOptions): void {
  closeItemPicker();

  const panel = document.createElement("div");
  panel.className = "item-picker";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", o.title);

  const currentLabel = o.forDummy ? "The dummy's item" : o.current?.locked ? "Locked in this slot" : "The optimizer's pick";
  const currentActions = o.forDummy
    ? `<button type="button" data-action="unlock">Remove</button>`
    : `${
        o.current?.locked
          ? `<button type="button" data-action="unlock">Unlock</button>`
          : `<button type="button" data-action="lock">Lock in</button>`
      }
      <button type="button" class="danger" data-action="ban">Ban</button>`;
  const currentHtml = !o.current
    ? ""
    : `<div class="picker-current">
        ${itemIconHtml(o.current.item, 40)}
        <div class="picker-current-text">
          <span class="picker-current-label">${currentLabel}</span>
          <span class="picker-current-name">${escapeHtml(o.current.item.name)}</span>
        </div>
        <div class="picker-current-actions">${currentActions}</div>
      </div>`;
  const hint = o.forDummy
    ? "Pick the item the dummy has in this slot."
    : "Pick an item to lock it into this slot. The optimizer fills the rest.";

  panel.innerHTML = `
    <div class="picker-head">
      <span class="picker-title">${escapeHtml(o.title)}</span>
      <button type="button" class="picker-close" data-action="close" aria-label="Close">×</button>
    </div>
    ${currentHtml}
    <input class="picker-search" type="search" placeholder="Search items…" aria-label="Search items" autocomplete="off" />
    <div class="picker-grid" role="listbox"></div>
    <p class="picker-hint">${hint}</p>`;
  document.body.append(panel);

  const grid = panel.querySelector<HTMLDivElement>(".picker-grid")!;
  const search = panel.querySelector<HTMLInputElement>(".picker-search")!;

  function drawGrid(): void {
    const typed = simplify(search.value);
    const shown = o.items.filter((item) => simplify(item.name).includes(typed));
    grid.innerHTML = shown.length
      ? shown
          .map((item) => {
            const why = o.unavailable.get(item.name);
            return `<button type="button" class="picker-item" data-pick="${escapeHtml(item.name)}" ${why ? "disabled" : ""} aria-label="${escapeHtml(item.name)}">${itemIconHtml(item, 44, why)}</button>`;
          })
          .join("")
      : `<p class="picker-empty">No item matches.</p>`;
  }
  drawGrid();
  search.addEventListener("input", drawGrid);

  // Place it under the slot, kept inside the window. (On phones CSS turns it into a bottom sheet.)
  const anchor = o.anchor.getBoundingClientRect();
  const width = panel.offsetWidth;
  const left = Math.min(Math.max(anchor.left + window.scrollX, 8), window.scrollX + window.innerWidth - width - 8);
  panel.style.left = `${left}px`;
  panel.style.top = `${anchor.bottom + window.scrollY + 8}px`;

  // Grid clicks: "mousedown"-free, so a disabled button simply does nothing.
  panel.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "close") return close();
    if (action === "unlock") return finish(() => o.onUnlock());
    if (action === "lock" && o.current) return finish(() => o.onLock(o.current!.item.name));
    if (action === "ban" && o.current) return finish(() => o.onBan(o.current!.item.name));
    if (button.dataset.pick) return finish(() => o.onLock(button.dataset.pick!));
  });

  const onOutside = (event: MouseEvent) => {
    if (!panel.contains(event.target as Node) && !o.anchor.contains(event.target as Node)) close();
  };
  const onKey = (event: KeyboardEvent) => {
    if (event.key === "Escape") close();
  };
  document.addEventListener("mousedown", onOutside);
  document.addEventListener("keydown", onKey);

  function close(): void {
    panel.remove();
    document.removeEventListener("mousedown", onOutside);
    document.removeEventListener("keydown", onKey);
    if (closeOpenPicker === close) closeOpenPicker = null;
  }
  function finish(action: () => void): void {
    close();
    action();
  }
  closeOpenPicker = close;
  search.focus();
}
