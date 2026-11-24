// The site's tooltip: ONE floating box, shown when the mouse (or keyboard focus) is on an element
// that asks for one:
//   data-item-id="3089"     → the full item card (item-card.ts); data-note="..." adds a line to it
//   data-tip="Death Lotus"  → plain text
// It sits above the element, or below if there's no room, and is kept inside the window.
import { getItemById } from "../data/items.ts";
import { escapeHtml } from "./html.ts";
import { itemCardHtml } from "./item-card.ts";

const margin = 8;

export function startTooltips(): void {
  const box = document.createElement("div");
  box.className = "tooltip";
  box.setAttribute("role", "tooltip");
  box.hidden = true;
  document.body.append(box);
  let current: Element | null = null;

  function show(target: Element): void {
    if (target === current) return;
    current = target;
    const itemId = target.getAttribute("data-item-id");
    const item = itemId ? getItemById(itemId) : undefined;
    if (item) {
      box.innerHTML = itemCardHtml(item, target.getAttribute("data-note") ?? undefined);
      box.classList.add("rich");
    } else {
      box.textContent = target.getAttribute("data-tip") ?? "";
      box.classList.remove("rich");
    }
    box.hidden = false;

    // Place it: centred above the element; below if it would go off the top; inside the window.
    const anchor = target.getBoundingClientRect();
    const size = box.getBoundingClientRect();
    let top = anchor.top - size.height - margin;
    if (top < margin) top = anchor.bottom + margin;
    let left = anchor.left + anchor.width / 2 - size.width / 2;
    left = Math.min(Math.max(left, margin), window.innerWidth - size.width - margin);
    box.style.top = `${Math.max(top, margin)}px`;
    box.style.left = `${left}px`;
  }

  function hide(): void {
    current = null;
    box.hidden = true;
  }

  const findTarget = (event: Event) => (event.target as Element | null)?.closest?.("[data-item-id], [data-tip]") ?? null;
  document.addEventListener("mouseover", (event) => {
    const target = findTarget(event);
    if (target) show(target);
    else hide();
  });
  document.addEventListener("focusin", (event) => {
    const target = findTarget(event);
    if (target) show(target);
  });
  document.addEventListener("focusout", hide);
  document.addEventListener("click", hide);
  window.addEventListener("scroll", hide, { passive: true });
}

// Plain-text tooltip helper for templates.
export const tipAttr = (text: string) => `data-tip="${escapeHtml(text)}"`;
