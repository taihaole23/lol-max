// The router: reads the web address and decides which page to show.
//
//   /                  → home page (big search bar)
//   /about             → "How it works" (rules, filtered items, sources)
//   /<champion>        → that champion's page, e.g. /katarina
//   /<champion>/<key>  → with one ability picked, e.g. /katarina/r
//   anything else      → "not found"
//
// Clicking a link inside the site changes the address WITHOUT reloading the page, using the
// browser's History API (history.pushState). The back / forward buttons fire "popstate", and
// we show the page for the new address again.
import { championList } from "../data/champion-list.ts";
import type { AbilityKey } from "../data/playable-champions.ts";

export type Route =
  | { page: "home" }
  | { page: "about" }
  | { page: "champion"; slug: string; ability: AbilityKey | null }
  | { page: "notFound" };

const abilityKeys: readonly AbilityKey[] = ["q", "w", "e", "r"];

export const paths = {
  home: "/",
  about: "/about",
  champion: (slug: string, ability?: AbilityKey) => (ability ? `/${slug}/${ability}` : `/${slug}`),
};

// Pure function (no page code), so the tests can check it.
export function parseRoute(path: string): Route {
  const parts = path.toLowerCase().split("/").filter((part) => part !== ""); // "/katarina/r/" → ["katarina", "r"]
  if (parts.length === 0) return { page: "home" };
  if (parts.length === 1 && parts[0] === "about") return { page: "about" };

  const [slug, ability, ...rest] = parts;
  if (rest.length > 0 || !championList.some((c) => c.slug === slug)) return { page: "notFound" };
  if (ability === undefined) return { page: "champion", slug, ability: null };
  if (!abilityKeys.includes(ability as AbilityKey)) return { page: "notFound" };
  return { page: "champion", slug, ability: ability as AbilityKey };
}

// Starts the router: shows the page for the current address, and again whenever it changes.
// Returns `navigate`, for code that wants to change page (e.g. picking a champion in the search).
export function startRouter(show: (route: Route) => void): (path: string) => void {
  const navigate = (path: string) => {
    if (path !== location.pathname) history.pushState(null, "", path);
    show(parseRoute(path));
    window.scrollTo(0, 0);
  };

  // Links inside the site: change page ourselves instead of letting the browser reload.
  // Links that open elsewhere (another site, a new tab, ctrl/cmd-click) are left alone.
  document.addEventListener("click", (event) => {
    const link = (event.target as HTMLElement).closest("a");
    if (!link || link.target || link.origin !== location.origin) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    navigate(link.pathname);
  });

  window.addEventListener("popstate", () => show(parseRoute(location.pathname)));
  show(parseRoute(location.pathname));
  return navigate;
}
