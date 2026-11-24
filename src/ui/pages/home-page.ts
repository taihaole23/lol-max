// Home: the title, one long search bar, and a show behind them (Eric: the plain page looked
// "static, stagnant, rigid, lame"; he asked for "anything that's extravagant and grand").
//
// The show has three parts, all drawn by CSS (style.css, "Home page"); this file only switches
// them on and off:
//   1. Splash art of EVERY champion, in a random order (Eric), filling the window: each one slowly
//      zooms and drifts, then cross-fades into the next every `slideSeconds`.
//   2. Damage numbers floating up and fading, like in the game: purple magic, orange physical,
//      green true, and now and then a big red crit.
//   3. A "Featuring" line under the search that names the champion on screen and links to their page.
//
// ~170 pictures can't all sit on the page (the browser would download every one at once), so there
// are only TWO picture layers that take turns: while one is on screen, the other quietly loads the
// next champion's picture, then fades in on top. The order is shuffled, and every champion is shown
// once before any repeats.
//
// People whose system asks for less motion get one still picture and no numbers.
import { championList, type ChampionListEntry } from "../../data/champion-list.ts";
import { PATCH } from "../../data/patch.ts";
import { isPlayableChampion, modelledAbilities, playableChampions } from "../../data/playable-champions.ts";
import { mountChampionSearch } from "../champion-search.ts";
import { escapeHtml } from "../html.ts";
import { iconPath } from "../icons.ts";
import { paths } from "../router.ts";

const show = {
  slideSeconds: 7, // how long each splash art stays (the fade takes 1.8 s of it: see style.css)
  fadeSeconds: 1.8, // = the fade in style.css (.home-slide's transition): change both
  numberEveryMs: 650, // a new damage number this often (half as often on a phone)
  critChance: 0.15, // the share of numbers that are a big red crit
};

// One damage number's look and a believable range for its size.
const numberKinds = [
  { type: "magic", min: 180, max: 1400, weight: 4 },
  { type: "physical", min: 120, max: 950, weight: 4 },
  { type: "true", min: 60, max: 500, weight: 2 },
] as const;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

function pickKind(): (typeof numberKinds)[number] {
  const total = numberKinds.reduce((sum, k) => sum + k.weight, 0);
  let roll = Math.random() * total;
  for (const kind of numberKinds) {
    roll -= kind.weight;
    if (roll < 0) return kind;
  }
  return numberKinds[0];
}

// A shuffled copy of a list (Fisher-Yates: walk from the end, swapping each item with a random
// earlier one, so every order is equally likely).
function shuffled<T>(list: readonly T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// The "Featuring" line for a champion. A playable one links to the ability the site calculates
// (R if it can, otherwise their first calculated one); any other champion links to their page.
function featuringHtml(champion: ChampionListEntry): string {
  const credit = champion.splash ? ` <span class="home-skin">(${escapeHtml(champion.splash.skin)})</span>` : "";
  if (!isPlayableChampion(champion.slug)) {
    return `Featuring <a href="${paths.champion(champion.slug)}">${escapeHtml(champion.name)}</a>${credit}`;
  }
  const modelled = modelledAbilities[champion.slug];
  const key = modelled.includes("r") ? "r" : modelled[0];
  const ability = playableChampions[champion.slug].abilities.list.find((a) => a.key === key)!;
  return `Featuring <a href="${paths.champion(champion.slug, key)}">${escapeHtml(champion.name)}: ${escapeHtml(ability.name)}</a>${credit}`;
}

// Draws the page and starts the show. Returns a "clean-up" function that stops the timers
// (the router calls it when you leave the page).
export function mountHomePage(root: HTMLElement, navigate: (path: string) => void): () => void {
  root.innerHTML = `
    <div class="home-stage" aria-hidden="true">
      <div class="home-slide"></div>
      <div class="home-slide"></div>
      <div class="home-shade"></div>
      <div id="home-numbers" class="home-numbers"></div>
    </div>
    <section class="hero home-hero">
      <h1 class="hero-title"><span class="hero-title-text">lol-max</span></h1>
      <p class="hero-tagline">Which build makes an ability hit the hardest?</p>
      <div id="home-search"></div>
      <p id="home-featuring" class="home-featuring"></p>
      <p class="hint">Patch ${PATCH} · <a href="${paths.about}">How it works</a></p>
    </section>`;
  mountChampionSearch(root.querySelector("#home-search")!, "large", (slug) => navigate(paths.champion(slug)));

  const layers = [...root.querySelectorAll<HTMLElement>(".home-slide")];
  const featuring = root.querySelector<HTMLElement>("#home-featuring")!;
  const numbers = root.querySelector<HTMLElement>("#home-numbers")!;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timers: number[] = []; // every timer still waiting, so leaving the page can cancel them
  const later = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms));
  let stopped = false;

  // ---- 1. The slideshow ----
  let order = shuffled(championList);
  let next = 0; // the position in `order` of the next champion to show
  function nextChampion(): ChampionListEntry {
    if (next >= order.length) {
      order = shuffled(championList); // everyone has been shown: a new random round
      next = 0;
    }
    return order[next++];
  }

  // Shows `champion` on the hidden layer, once its picture has loaded (so it never fades in half
  // drawn): the layer on screen gets "leaving" (it fades out but keeps zooming, so it never jumps
  // back to its starting size while you can still see it) and the hidden one gets "active".
  let front = -1; // which layer is on screen (-1: none yet)
  function showChampion(champion: ChampionListEntry, then: () => void): void {
    const url = iconPath.splash(champion.slug);
    const image = new Image();
    image.onload = image.onerror = () => {
      if (stopped) return;
      const back = front === 0 ? 1 : 0;
      const incoming = layers[back];
      incoming.style.backgroundImage = `url('${url}')`;
      // Restart its zoom from the beginning: take the class off, make the browser notice (reading
      // a size does that), then put it back.
      incoming.classList.remove("active", "leaving");
      void incoming.offsetWidth;
      incoming.classList.add("active");
      if (front !== -1) {
        const outgoing = layers[front];
        outgoing.classList.replace("active", "leaving");
        // Once it's fully faded out, it can stop zooming (nobody sees it jump now).
        later(show.fadeSeconds * 1000, () => outgoing.classList.remove("leaving"));
      }
      front = back;

      featuring.innerHTML = featuringHtml(champion);
      featuring.classList.remove("swap"); // restart the line's fade-in, the same way
      void featuring.offsetWidth;
      featuring.classList.add("swap");
      then();
    };
    image.src = url;
  }

  // Each picture stays `slideSeconds`, then the next one starts loading. A background tab waits
  // (no need to download pictures nobody sees) and carries on when you come back.
  function cycle(): void {
    later(show.slideSeconds * 1000, () => {
      if (document.hidden) {
        cycle();
        return;
      }
      showChampion(nextChampion(), cycle);
    });
  }

  if (reduceMotion) {
    showChampion(nextChampion(), () => {}); // one still picture
    return () => {
      stopped = true;
    };
  }
  showChampion(nextChampion(), cycle);

  // ---- 2. Damage numbers ----
  // Each one is a <span> that CSS floats up and fades; it removes itself after. They stay out of the
  // middle column, where the title and search are.
  function spawnNumber(): void {
    if (document.hidden) return;
    // A crit is a big physical hit (crits are physical in the game), drawn in red.
    const crit = Math.random() < show.critChance;
    const kind = crit ? numberKinds[1] : pickKind();
    const value = Math.round(randomBetween(kind.min, kind.max) * (crit ? 2.2 : 1));
    const span = document.createElement("span");
    span.className = `home-number ${crit ? "crit" : kind.type}`;
    span.textContent = crit ? `${value.toLocaleString("en-US")}!` : value.toLocaleString("en-US");
    const side = Math.random() < 0.5 ? randomBetween(3, 30) : randomBetween(70, 95); // % from the left
    span.style.left = `${side}%`;
    span.style.top = `${randomBetween(25, 85)}%`;
    span.style.setProperty("--drift", `${randomBetween(-40, 40).toFixed(0)}px`);
    span.addEventListener("animationend", () => span.remove());
    numbers.append(span);
  }
  const phone = window.matchMedia("(max-width: 600px)").matches;
  const numberTimer = window.setInterval(spawnNumber, show.numberEveryMs * (phone ? 2 : 1));

  return () => {
    stopped = true;
    timers.forEach((t) => window.clearTimeout(t));
    window.clearInterval(numberTimer);
  };
}
