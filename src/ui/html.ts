// Small helpers for building the page.

// Makes text safe to put inside HTML: "<" would otherwise start a tag, and a quote would end
// an attribute early (item names like "Jak'Sho" have one). All our text comes from our own data
// files, but escaping it anyway means a future data mistake can't break the page.
export function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Finds an element by id, and stops with a clear error if index.html doesn't have it.
export function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`index.html has no element with id="${id}"`);
  return element as T;
}

// Reads a number box. An empty box (or anything that isn't a number) gives null.
export function readNumber(input: HTMLInputElement): number | null {
  if (input.value.trim() === "") return null;
  const value = Number(input.value);
  return Number.isFinite(value) ? value : null;
}
