// Entry point: the browser runs this file first (index.html loads it).
//
// It sets up the parts every page shares (the top bar and the theme), then starts the router,
// which shows the right page for the web address. Each page lives in src/ui/pages/.
import "./style.css";
import { championList } from "./data/champion-list.ts";
import { applyChampionColors } from "./ui/champion-colors.ts";
import { mountChampionSearch } from "./ui/champion-search.ts";
import { byId } from "./ui/html.ts";
import { mountChampionPage } from "./ui/pages/champion-page.ts";
import { mountHomePage } from "./ui/pages/home-page.ts";
import { mountAboutPage, mountNotFoundPage } from "./ui/pages/simple-pages.ts";
import { paths, startRouter, type Route } from "./ui/router.ts";
import { applyTheme, currentTheme } from "./ui/theme.ts";
import { startTooltips } from "./ui/tooltip.ts";
import { inject } from '@vercel/analytics';

//vercel analytics
inject();

// One floating tooltip for the whole site (item cards, ability names).
startTooltips();

// ---- Theme toggle (dark by default) ----
// The button shows an icon of the mode you'd switch TO (Eric: just a symbol): a sun on the dark
// theme, a moon on the light one. Screen readers and the hover tooltip get the words.
const sunIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`;
const moonIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>`;
const themeButton = byId<HTMLButtonElement>("theme-toggle");
function drawThemeButton(): void {
  const next = currentTheme() === "dark" ? "light" : "dark";
  themeButton.innerHTML = next === "light" ? sunIcon : moonIcon;
  themeButton.setAttribute("aria-label", `Switch to ${next} mode`);
  themeButton.title = `Switch to ${next} mode`;
}
themeButton.addEventListener("click", () => {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
  drawThemeButton();
});
drawThemeButton();

// ---- Top bar: see-through at the top of a champion page, frosted as you scroll ----
// The CSS does the look; this only tells it how far down the page is, as --bar-fade: 0 at the top,
// rising to 1 at BAR_FADE_DISTANCE px down, so the frosted bar fades in with the scroll (Eric).
// "passive" tells the browser this listener never blocks scrolling, so scrolling stays smooth.
const BAR_FADE_DISTANCE = 240;
const updateBarFade = () =>
  document.body.style.setProperty("--bar-fade", String(Math.min(window.scrollY / BAR_FADE_DISTANCE, 1)));
window.addEventListener("scroll", updateBarFade, { passive: true });
updateBarFade();

// ---- Pages ----

// Pages get `goTo` to change page. It looks `navigate` up only when it's CALLED (on a click),
// because startRouter draws the first page before `navigate` exists.
let navigate: (path: string) => void = () => {};
const goTo = (path: string) => navigate(path);

// The page being shown "cleans up" before the next one is drawn (e.g. the champion page stops
// listening for search results).
let cleanUpPage: () => void = () => {};

function show(route: Route): void {
  cleanUpPage();
  cleanUpPage = () => {};

  // A fresh container for each page: its listeners are thrown away with it when the page changes.
  const root = document.createElement("div");
  root.className = `page page-${route.page}`;
  byId("page").replaceChildren(root);

  // The small search bar in the top bar, everywhere except home (which has the big one).
  byId("topbar-search").hidden = route.page === "home";
  // A champion page takes its colours from the splash art; every other page uses the normal red.
  applyChampionColors(route.page === "champion" ? route.slug : null);

  if (route.page === "home") {
    document.title = "lol-max: max out an ability's damage";
    cleanUpPage = mountHomePage(root, goTo);
  } else if (route.page === "about") {
    document.title = "How it works · lol-max";
    mountAboutPage(root);
  } else if (route.page === "champion") {
    const name = championList.find((c) => c.slug === route.slug)?.name ?? route.slug;
    document.title = `${name}${route.ability ? " " + route.ability.toUpperCase() : ""} · lol-max`;
    cleanUpPage = mountChampionPage(root, route.slug, route.ability, goTo);
  } else {
    document.title = "Not found · lol-max";
    mountNotFoundPage(root);
  }
}

navigate = startRouter(show);
mountChampionSearch(byId("topbar-search"), "small", (slug) => goTo(paths.champion(slug)));
