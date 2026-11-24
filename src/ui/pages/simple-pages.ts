// The pages with little logic of their own: home, "How it works" and "not found".
import { PATCH } from "../../data/patch.ts";
import { mountChampionSearch } from "../champion-search.ts";
import { rulesHtml, sourcesHtml } from "../info-view.ts";
import { paths } from "../router.ts";

// Home: the title and one long search bar in the middle.
export function mountHomePage(root: HTMLElement, navigate: (path: string) => void): void {
  root.innerHTML = `
    <section class="hero">
      <h1 class="hero-title">lol-max</h1>
      <p class="hero-tagline">Which build makes an ability hit the hardest?</p>
      <div id="home-search"></div>
      <p class="hint">Patch ${PATCH} · <a href="${paths.about}">How it works</a></p>
    </section>`;
  mountChampionSearch(root.querySelector("#home-search")!, "large", (slug) => navigate(paths.champion(slug)));
}

// "How it works": every rule the calculator follows, the items left out of the search, and sources.
export function mountAboutPage(root: HTMLElement): void {
  root.innerHTML = `
    <section class="panel info">${rulesHtml()}</section>
    <section class="panel info">${sourcesHtml()}</section>`;
}

export function mountNotFoundPage(root: HTMLElement): void {
  root.innerHTML = `
    <section class="panel">
      <h1>Page not found</h1>
      <p>There's nothing at this address. <a href="${paths.home}">Back to the start</a>.</p>
    </section>`;
}
