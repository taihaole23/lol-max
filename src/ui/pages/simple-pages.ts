// The pages with little logic of their own: "How it works" and "not found". (Home: home-page.ts.)
import { rulesHtml, sourcesHtml } from "../info-view.ts";
import { paths } from "../router.ts";

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
