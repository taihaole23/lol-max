// The champion search bar: large on the home page, small in the top bar.
//
// It lists EVERY champion and narrows the list as you type (Eric). Champions the site can
// calculate come first; the others are marked "coming soon" but can still be opened.
//
// Keyboard: ↓ / ↑ move through the list, Enter opens the highlighted champion, Escape closes it.
import { championList, type ChampionListEntry } from "../data/champion-list.ts";
import { isPlayableChampion } from "../data/playable-champions.ts";
import { escapeHtml } from "./html.ts";
import { iconPath } from "./icons.ts";

// Lowercase letters and digits only, so "kai sa", "kaisa" and "Kai'Sa" all match.
const simplify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, "");

// The champions to show for what's typed. Pure (no page code), so the tests can check it.
// Order: playable champions first, then names that START with the text, then A to Z.
export function matchChampions(query: string): ChampionListEntry[] {
  const typed = simplify(query);
  const rank = (c: ChampionListEntry) => (isPlayableChampion(c.slug) ? 0 : 2) + (simplify(c.name).startsWith(typed) ? 0 : 1);
  return championList
    .filter((c) => simplify(c.name).includes(typed))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}

// Builds a search bar inside `container`. `onPick` is called with the chosen champion's slug.
export function mountChampionSearch(container: HTMLElement, size: "large" | "small", onPick: (slug: string) => void): void {
  const id = `search-${size}`;
  container.innerHTML = `
    <div class="champion-search ${size}">
      <input id="${id}" type="search" role="combobox" autocomplete="off" spellcheck="false"
        placeholder="Search a champion…" aria-label="Search a champion"
        aria-expanded="false" aria-controls="${id}-list" />
      <ul id="${id}-list" class="search-results" role="listbox" hidden></ul>
    </div>`;
  const input = container.querySelector<HTMLInputElement>("input")!;
  const list = container.querySelector<HTMLUListElement>("ul")!;
  let matches: ChampionListEntry[] = [];
  let highlighted = 0;

  function draw(): void {
    list.innerHTML = matches
      .map((c, i) => {
        const soon = isPlayableChampion(c.slug) ? "" : `<span class="soon">coming soon</span>`;
        return `
          <li id="${id}-option-${i}" role="option" data-slug="${c.slug}" aria-selected="${i === highlighted}"
            class="${i === highlighted ? "highlighted" : ""} ${isPlayableChampion(c.slug) ? "" : "unavailable"}">
            <img src="${iconPath.champion(c.slug)}" alt="" width="32" height="32" loading="lazy" />
            <span class="search-name">${escapeHtml(c.name)}</span>${soon}
          </li>`;
      })
      .join("");
    if (matches.length === 0) list.innerHTML = `<li class="no-match">No champion called that.</li>`;
    input.setAttribute("aria-activedescendant", matches.length ? `${id}-option-${highlighted}` : "");
    list.querySelector(".highlighted")?.scrollIntoView({ block: "nearest" });
  }

  function open(): void {
    matches = matchChampions(input.value);
    highlighted = 0;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    draw();
  }

  function close(): void {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  function pick(slug: string): void {
    input.value = "";
    close();
    input.blur();
    onPick(slug);
  }

  input.addEventListener("focus", open);
  input.addEventListener("input", open);
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (list.hidden) open();
      const step = event.key === "ArrowDown" ? 1 : -1;
      highlighted = Math.min(Math.max(highlighted + step, 0), matches.length - 1);
      draw();
    } else if (event.key === "Enter" && matches[highlighted]) {
      event.preventDefault();
      pick(matches[highlighted].slug);
    } else if (event.key === "Escape") {
      close();
    }
  });
  // "mousedown" (not "click") so it runs before the box loses focus and closes the list.
  list.addEventListener("mousedown", (event) => {
    const option = (event.target as HTMLElement).closest<HTMLLIElement>("li[data-slug]");
    if (!option) return;
    event.preventDefault();
    pick(option.dataset.slug!);
  });
  input.addEventListener("blur", close);
}
