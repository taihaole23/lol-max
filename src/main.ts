// Entry point: the browser runs this file first (index.html loads it).
//
// It sets up the parts every page shares (the top bar and the theme), then starts the router,
// which shows the right page for the web address. Each page lives in src/ui/pages/.
import "./style.css";
import { championList } from "./data/champion-list.ts";
import { mountChampionSearch } from "./ui/champion-search.ts";
import { byId } from "./ui/html.ts";
import { mountChampionPage } from "./ui/pages/champion-page.ts";
import { mountAboutPage, mountHomePage, mountNotFoundPage } from "./ui/pages/simple-pages.ts";
import { paths, startRouter, type Route } from "./ui/router.ts";
import { applyTheme, currentTheme } from "./ui/theme.ts";

// ---- Theme toggle (dark by default) ----
const themeButton = byId<HTMLButtonElement>("theme-toggle");
function drawThemeButton(): void {
  const next = currentTheme() === "dark" ? "light" : "dark";
  themeButton.textContent = next === "light" ? "Light mode" : "Dark mode";
  themeButton.setAttribute("aria-label", `Switch to ${next} mode`);
}
themeButton.addEventListener("click", () => {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
  drawThemeButton();
});
drawThemeButton();

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

  if (route.page === "home") {
    document.title = "lol-max: max out an ability's damage";
    mountHomePage(root, goTo);
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
