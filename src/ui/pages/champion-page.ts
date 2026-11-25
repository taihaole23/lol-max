// A champion's page: /katarina, /katarina/r ...
//
// How it works:
//   1. `state` (src/ui/state.ts) holds everything the user has picked.
//   2. When the user clicks or types, we call a state function to get a new state...
//   3. ...and call `render()`, which redraws the page from the state.
// The page never stores anything the state doesn't have, so it can't get out of sync.
// `state` lives outside the page, so going to "How it works" and back keeps your settings.
import { championList } from "../../data/champion-list.ts";
import { champions } from "../../data/champions.ts";
import { dummyPresets, type EnemyType } from "../../data/dummy-presets.ts";
import { inventory } from "../../data/game-rules.ts";
import { getItem, items, type Item } from "../../data/items.ts";
import {
  isModelled,
  isPlayableChampion,
  modelledAbilities,
  noDamageAbilities,
  playableChampions,
  type AbilityKey,
} from "../../data/playable-champions.ts";
import { stages, type StageName } from "../../data/stages.ts";
import { lockableLegendaries } from "../../optimizer/constraints.ts";
import { bootsPool } from "../../optimizer/item-pool.ts";
import { canBeBuiltTogether } from "../../optimizer/legal.ts";
import type { ExplainedBuild, SearchResult } from "../../optimizer/messages.ts";
import { maxItemCount } from "../../optimizer/setup.ts";
import { damageRule } from "../../simulation/abilities.ts";
import { panelStatInfo, panelStats, type PanelStat } from "../../stats/stat-panel.ts";
import { statIconHtml } from "../stat-icons.ts";
import { byId, escapeHtml, readNumber } from "../html.ts";
import { iconPath, itemIconHtml } from "../icons.ts";
import { closeItemPicker, openItemPicker } from "../item-picker.ts";
import { progressLabel } from "../progress.ts";
import { countTo, showText } from "../count-up.ts";
import { alwaysCrits, alwaysCritTitle, neverCrits, breakdownHtml, buildAt, topBuildsHtml } from "../results-view.ts";
import { paths } from "../router.ts";
import * as searches from "../searches.ts";
import { landGapMs, rollingAllowed, rollingSlotHtml, setRollPools, startRolling, stopRolling } from "../slot-roller.ts";
import * as actions from "../state.ts";
import type { PageState, SlotContent } from "../state.ts";

let state: PageState = actions.initialState();

// The two questions the current inputs ask: the quick one (locked items + 1 + boots) and the full one.
const quickRequest = () => actions.quickSearchRequest(state);
const fullRequest = () => actions.fullSearchRequest(state);

// Every change goes through here: work out the new state, redraw, and let the searches know.
// (inputsChanged starts a quick search if the answer is out of date; it redraws when done.)
function update(change: (old: PageState) => PageState): void {
  state = change(state);
  render();
  searches.inputsChanged(quickRequest(), fullRequest());
}

// Nothing re-runs Optimize by itself (Eric): after any change, including locks, bans and the
// boots switches, the quick answer shows and Optimize waits for a click, so several changes
// can be made in a row without waiting.

// ---- Labels and small pieces ----

const stageLabels: Record<StageName, string> = { early: "Early", mid: "Mid", late: "Late", full: "Full" };
const enemyTypeLabels: Record<EnemyType, string> = { squishy: "Squishy", bruiser: "Bruiser", tank: "Tank" };

// The dummy's item picker lists every legendary and support item, and every tier-2 boots, A to Z.
// Support items are included because a support dummy (Nami) buys one, like Dream Maker.
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
const dummyLegendaryNames = items
  .filter((i) => i.category === "legendary" || i.category === "support")
  .sort(byName)
  .map((i) => i.name);
const dummyBootsNames = items.filter((i) => i.category === "boots").sort(byName).map((i) => i.name);

const lockIcon = `<svg class="lock-badge" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 7V5a3 3 0 0 1 6 0v2h.5A1.5 1.5 0 0 1 13 8.5v5A1.5 1.5 0 0 1 11.5 15h-7A1.5 1.5 0 0 1 3 13.5v-5A1.5 1.5 0 0 1 4.5 7H5Zm1.5 0h3V5a1.5 1.5 0 0 0-3 0v2Z"/></svg>`;

// A toggle switch: a real checkbox (so keyboards and screen readers work), drawn as a switch by CSS.
const switchHtml = (id: string, label: string) =>
  `<label class="switch"><input id="${id}" type="checkbox" /><span class="switch-track" aria-hidden="true"></span><span>${label}</span></label>`;

// A number box with big ▲ / ▼ buttons (Eric: the browser's own arrows are too small to hit).
// Each press adds or takes away `stepSize` (HP 100, armor and MR 10, levels 1) and then acts
// exactly like typing the new number. The buttons are skipped by Tab (keyboard users have the arrow keys).
const numberBoxHtml = (id: string, name: string, stepSize: number, limits: string) => `
  <span class="stepper">
    <input id="${id}" type="number" step="any" ${limits} data-step-size="${stepSize}" />
    <span class="stepper-buttons">
      <button type="button" tabindex="-1" data-step-for="${id}" data-step-by="1" aria-label="${name} up ${stepSize}">▲</button>
      <button type="button" tabindex="-1" data-step-for="${id}" data-step-by="-1" aria-label="${name} down ${stepSize}">▼</button>
    </span>
  </span>`;

// One tile per stat in panelStatInfo: its icon and name, a Max button that switches maximizing it
// on or off (aria-pressed tells screen readers it's a toggle), and its minimum (crit chance typed
// in %, "100"). `--stat` gives the tile its colour (style.css). It's a <div>, not a <label>: a label
// would send clicks on the name to the Max button, so the number box gets its own aria-label.
const minStatBoxesHtml = () =>
  panelStatInfo
    .map(
      (info) => `
      <div id="tile-${info.key}" class="stat-tile" style="--stat: var(--stat-${info.key})">
        <div class="stat-tile-head">
          <span class="stat-icon">${statIconHtml(info.key)}</span>
          <span class="stat-name" title="${info.label}">${info.short}${info.unit ? ` <span class="stat-unit">${info.unit}</span>` : ""}</span>
          <button type="button" class="max-toggle" data-maximize="${info.key}" aria-pressed="false" aria-label="Maximize ${info.label}" title="Maximize ${info.label}">Max</button>
        </div>
        ${numberBoxHtml(`min-${info.key}`, `Minimum ${info.label}`, info.step, `min="0" aria-label="Minimum ${info.label}"`)}
      </div>`,
    )
    .join("");

// A stat value in the box's unit, rounded for showing: crit 1 → 100, attack speed 1.234 → 1.23.
function shownStat(stat: PanelStat, value: number): string {
  const info = panelStatInfo.find((s) => s.key === stat)!;
  const shown = value * info.shownAs;
  return stat === "attackSpeed" ? shown.toFixed(2) : String(Math.round(shown));
}

// ---- The page's HTML (filled in by the render functions below) ----

// The top of every champion page (calculated or not): splash art, portrait, name, the selected
// ability's name underneath.
function heroHtml(slug: string, name: string, sub = ""): string {
  const skin = championList.find((c) => c.slug === slug)?.splash?.skin;
  return `
    <!-- Splash art behind the header (one of the champion's best skins), fading into the page. -->
    <div class="champ-splash" style="background-image:url('${iconPath.splash(slug)}')" aria-hidden="true"></div>
    ${skin ? `<p class="splash-credit">Splash art: ${escapeHtml(skin)}</p>` : ""}
    <section class="champ-hero">
      <img class="champ-portrait" src="${iconPath.champion(slug)}" alt="" width="96" height="96" />
      <div>
        <h1 class="champ-name">${escapeHtml(name)}</h1>
        <p id="champ-sub" class="champ-sub">${escapeHtml(sub)}</p>
      </div>
    </section>`;
}

type AbilityInfo = { key: AbilityKey; name: string; maxRank: number };

// One ability in the ability bar: big icon with its key, name on hover, rank boxes underneath.
// Used by every champion page; `pips` are the rank boxes (buttons where ranks can be changed).
// `note` is added to the name on hover when the ability can't be calculated ("coming soon", "no damage").
function abilityCardHtml(
  slug: string,
  ability: AbilityInfo,
  selected: boolean,
  modelled: boolean,
  pips: string,
  note = "coming soon",
): string {
  const tip = modelled ? ability.name : `${ability.name} · ${note}`;
  return `
    <div class="ability${selected ? " selected" : ""}${modelled ? "" : " unavailable"}">
      <button type="button" class="ability-icon" data-ability="${ability.key}" data-tip="${escapeHtml(tip)}"
        aria-label="${escapeHtml(tip)}" aria-pressed="${selected}">
        <img src="${iconPath.ability(slug, ability.key)}" alt="" width="84" height="84" />
        <span class="ability-key">${ability.key.toUpperCase()}</span>
      </button>
      <div class="rank-pips">${pips}</div>
    </div>`;
}

const abilitySub = (ability: AbilityInfo | undefined) => (ability ? `${ability.name} (${ability.key.toUpperCase()})` : "");

function pageHtml(slug: string, name: string): string {
  return `
    ${heroHtml(slug, name)}

    <nav id="abilities" class="ability-bar" aria-label="Abilities"></nav>

    <!-- Shown when an ability that can't be calculated is selected (filled in by render). -->
    <section id="coming-soon" class="panel empty-state" hidden></section>

    <section id="optimizer" class="workbench">
      <div class="panel">
        <header class="panel-head"><h2>Your build</h2><span id="setup-summary" class="panel-sub"></span></header>

        <div class="field-row">
          <div class="field">
            <span class="field-label">Stage</span>
            <div id="stage-buttons" class="segmented" role="group" aria-label="Stage preset"></div>
          </div>
          <label class="field">
            <span class="field-label">Level</span>
            ${numberBoxHtml("level", "Level", 1, 'min="1" max="18"')}
          </label>
        </div>

        <div class="switch-row">
          ${switchHtml("boots-on", "Boots")}
          ${switchHtml("mid-quest", "Mid quest done (tier-3 boots)")}
        </div>

        <p id="ability-locked" class="notice" hidden></p>

        <div class="field">
          <span class="field-label">Items <span class="field-hint">Click a slot to lock or ban an item</span></span>
          <!-- Always 6 slots wide, so the − / + buttons never move. -->
          <div class="slot-row">
            <div id="item-slots" class="slots"></div>
            <div class="slot-buttons">
              <button id="remove-slot" type="button" aria-label="Remove an item slot">−</button>
              <button id="add-slot" type="button" aria-label="Add an item slot">+</button>
            </div>
          </div>
          <div id="conditions" class="conditions"></div>
        </div>

        <!-- Minimum stats: only builds that reach every number typed here (state.minStats). -->
        <details id="min-stats" class="min-stats">
          <summary><span class="field-label">Stats</span> <span id="min-stats-count" class="field-hint"></span></summary>
          <p class="field-hint">Type a minimum to only show builds with at least that much (totals, as in the game's stat panel). The grey numbers are the build shown.</p>
          <p class="field-hint">Max ranks builds by that stat instead of damage. With several, the build whose weakest one is closest to its best wins.</p>
          <div class="stat-row min-stat-row">${minStatBoxesHtml()}</div>
          <p class="field-hint"><button id="clear-min-stats" type="button" class="link-button">Clear minimums and Max</button></p>
        </details>

        <div class="optimize-row">
          <button id="optimize" type="button" class="primary">Optimize</button>
          <div id="progress" class="progress" hidden>
            <div id="progress-fill" class="progress-fill"></div>
            <span id="progress-text" class="progress-text"></span>
          </div>
        </div>
      </div>

      <div class="panel">
        <header class="panel-head"><h2>Target dummy</h2></header>

        <div id="enemy-types" class="enemy-row" role="group" aria-label="Enemy type"></div>

        <div class="field">
          <span class="field-label field-label-row">
            <span>Items <span class="field-hint">Click a slot to change it</span></span>
            ${switchHtml("use-recommended", "Recommended")}
          </span>
          <div id="dummy-items" class="dummy-items"></div>
        </div>

        <!-- Level sits with the stats, so this panel is about as tall as "Your build". -->
        <div class="stat-row">
          <label class="field"><span class="field-label">Level</span>${numberBoxHtml("dummy-level", "Dummy level", 1, 'min="1" max="18"')}</label>
          <label class="field"><span class="field-label">HP</span>${numberBoxHtml("dummy-hp", "HP", 100, 'min="1"')}</label>
          <label class="field"><span class="field-label">Armor</span>${numberBoxHtml("dummy-armor", "Armor", 10, 'min="0"')}</label>
          <label class="field"><span class="field-label">Magic resist</span>${numberBoxHtml("dummy-magic-resist", "Magic resist", 10, 'min="0"')}</label>
        </div>
        <p class="field-hint">Type a number to override it. <button id="reset-stats" type="button" class="link-button">Reset</button></p>

        <!-- The dummy's health when the cast starts (state.dummyHealthPercent), for every ability. -->
        <div id="dummy-health-row" class="stat-row">
          <label class="field"><span class="field-label">Health %</span>${numberBoxHtml("dummy-health", "Dummy health percent", 10, 'min="1" max="100"')}</label>
        </div>
        <p class="field-hint">Health %: the dummy's health when the ability is cast (100 = full).</p>
      </div>

      <div class="panel results">
        <header class="results-head">
          <div>
            <span id="damage-label" class="field-label"></span>
            <p id="damage-total" class="damage-total"></p>
          </div>
          <p id="damage-note" class="damage-note"></p>
        </header>
        <p id="search-error" class="notice" hidden></p>
        <div id="top-builds"></div>
        <div id="breakdown"></div>
        <p class="field-hint">How every number is worked out, and the sources: <a href="${paths.about}">How it works</a>.</p>
      </div>
    </section>`;
}

// A champion the site can't calculate yet (Eric): the same page as Katarina's, with all 4
// abilities "coming soon" like her Q, W and E. The abilities come from the champion list (Data
// Dragon), so every champion gets this page with no extra work. Rank boxes are shown but empty.
function comingSoonHtml(slug: string, name: string, abilityKey: AbilityKey | null): string {
  const abilities = championList.find((c) => c.slug === slug)?.abilities ?? [];
  const selected = abilities.find((a) => a.key === abilityKey);
  const emptyPips = (a: AbilityInfo) => `<span class="rank-pip" aria-hidden="true"></span>`.repeat(a.maxRank);
  const bar = abilities.map((a) => abilityCardHtml(slug, a, a.key === abilityKey, false, emptyPips(a))).join("");
  return `
    ${heroHtml(slug, name, abilitySub(selected) || "Coming soon")}
    <nav class="ability-bar" aria-label="Abilities">${bar}</nav>
    <section class="panel empty-state">
      <h2>${escapeHtml(selected ? `${selected.name} isn't` : `${name} isn't`)} modelled yet</h2>
      <p>Right now the site calculates ${Object.values(playableChampions)
        .map((c) => `<a href="${paths.champion(championList.find((x) => x.name === c.name)?.slug ?? "")}">${escapeHtml(c.name)}</a>`)
        .join(", ")}. More champions are on the way.</p>
    </section>`;
}

// ---- Drawing the page ----

// The selected ability's name and data ("Death Lotus").
const selectedAbility = () => playableChampions[state.champion].abilities.list.find((a) => a.key === state.ability)!;

// What the panel says for an ability that can't be calculated.
function notCalculatedHtml(): string {
  const ability = selectedAbility();
  const noDamageReason = noDamageAbilities[state.champion][ability.key];
  if (noDamageReason) {
    const others = modelledAbilities[state.champion].map((key) => key.toUpperCase());
    return `
      <h2>${escapeHtml(ability.name)} deals no damage</h2>
      <p>${escapeHtml(noDamageReason)}
        Pick ${others.slice(0, -1).join(", ")} or ${others.at(-1)} to see their best builds.</p>`;
  }
  return `
    <h2>Coming soon</h2>
    <p>This ability isn't modelled yet.</p>`;
}

function render(): void {
  renderAbilities();
  const modelled = isModelled(state.champion, state.ability);
  byId("optimizer").hidden = !modelled;
  byId("coming-soon").hidden = modelled;
  if (!modelled) byId("coming-soon").innerHTML = notCalculatedHtml();
  renderSetup();
  renderDummy();
  renderResults();
}

function renderAbilities(): void {
  const champion = playableChampions[state.champion];
  byId("champ-sub").textContent = abilitySub(champion.abilities.list.find((a) => a.key === state.ability));

  byId("abilities").innerHTML = champion.abilities.list
    .map((ability) => {
      const rank = state.ranks[ability.key];

      // One pip per rank. Filled = ranks you have. A pip is disabled if clicking it would break the
      // level rules: a rank too high for the level, or more skill points than the level gives.
      const pips = [];
      for (let pip = 1; pip <= ability.maxRank; pip++) {
        const filled = pip <= rank ? " filled" : "";
        const allowed = actions.rankAllowed(state, ability.key, pip);
        pips.push(
          `<button type="button" class="rank-pip${filled}" data-rank-of="${ability.key}" data-rank="${pip}"` +
            ` aria-label="${escapeHtml(ability.name)} rank ${pip}"${allowed ? "" : " disabled"}></button>`,
        );
      }

      const modelled = isModelled(state.champion, ability.key);
      const note = noDamageAbilities[state.champion][ability.key] ? "no damage" : "coming soon";
      return abilityCardHtml(state.champion, ability, ability.key === state.ability, modelled, pips.join(""), note);
    })
    .join("");
}

function renderSetup(): void {
  byId("setup-summary").textContent = `Level ${state.level} · ${actions.skillPointsText(state)}`;

  byId("stage-buttons").innerHTML = (Object.keys(stages) as StageName[])
    .map((stage) => {
      const selected = stage === state.stage;
      return `<button type="button" class="${selected ? "selected" : ""}" aria-pressed="${selected}" data-stage="${stage}">${stageLabels[stage]}</button>`;
    })
    .join("");

  byId<HTMLInputElement>("level").value = String(state.level);
  byId<HTMLInputElement>("boots-on").checked = state.bootsOn;
  const midQuest = byId<HTMLInputElement>("mid-quest");
  midQuest.checked = state.midQuest;
  midQuest.disabled = !state.bootsOn;

  const problem = actions.abilityProblem(state);
  byId("ability-locked").hidden = problem === null;
  byId("ability-locked").textContent = problem ?? "";
  byId<HTMLButtonElement>("remove-slot").disabled = state.itemCount <= 1;
  byId<HTMLButtonElement>("add-slot").disabled = state.itemCount >= maxItemCount(actions.bootsSetting(state));
  renderConditions();
  renderMinStats();
}

// The minimum stat boxes: the typed number, or empty. The count shows even while the box is closed.
function renderMinStats(): void {
  const set = Object.keys(state.minStats).length;
  const maxed = state.maximize.length;
  const parts = [set ? `${set} minimum${set > 1 ? "s" : ""}` : "", maxed ? `maximizing ${maxed}` : ""].filter(Boolean);
  byId("min-stats-count").textContent = parts.join(" · ");
  if (set || maxed) byId<HTMLDetailsElement>("min-stats").open = true; // never hide a rule that's in force
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-maximize]")) {
    const on = state.maximize.includes(button.dataset.maximize as PanelStat);
    button.classList.toggle("selected", on);
    button.setAttribute("aria-pressed", String(on));
  }
  // A tile glows in its colour while it's doing something (a minimum or Max).
  for (const info of panelStatInfo) {
    const tile = byId(`tile-${info.key}`);
    tile.classList.toggle("has-min", state.minStats[info.key] !== undefined);
    tile.classList.toggle("is-max", state.maximize.includes(info.key));
  }
  for (const info of panelStatInfo) {
    const input = byId<HTMLInputElement>(`min-${info.key}`);
    const min = state.minStats[info.key];
    input.value = min === undefined ? "" : shownStat(info.key, min);
    input.classList.toggle("typed", min !== undefined);
  }
}

// The grey hint in each empty minimum box: the stat of the build being shown, so you can see
// how far a build is from a number before typing it.
function renderMinStatHints(items: Item[] | undefined): void {
  const stats = items ? panelStats(state.champion, state.level, items, state.ability) : null;
  for (const info of panelStatInfo) {
    byId<HTMLInputElement>(`min-${info.key}`).placeholder = stats ? shownStat(info.key, stats[info.key]) : "";
  }
}

// The ban list under the slots, and a way to clear every lock and ban.
function renderConditions(): void {
  const hasLocks = state.locked.some((n) => n !== null) || state.lockedBoots !== null;
  if (state.banned.length === 0 && !hasLocks) {
    byId("conditions").innerHTML = "";
    return;
  }
  const chips = state.banned
    .map((name) => {
      const item = getItem(name);
      return `<button type="button" class="ban-chip" data-unban="${escapeHtml(name)}" aria-label="Unban ${escapeHtml(name)}">${itemIconHtml(item, 26, "Banned. Click to allow it again.")}<span aria-hidden="true">×</span></button>`;
    })
    .join("");
  byId("conditions").innerHTML = `
    ${state.banned.length ? `<span class="conditions-label">Banned</span>${chips}` : ""}
    <button type="button" id="clear-conditions" class="link-button">Clear locks and bans</button>`;
}

// Which of the top 5 is shown. It belongs to one result: a new result starts again at #1.
let selectedBuild: { result: SearchResult | null; index: number } = { result: null, index: 0 };

// The casino roll: which Optimize search the slots are spinning for, and the answer being revealed.
let rollKey: string | null = null;
let reveal: { result: SearchResult; start: number; done: boolean } | null = null;
let lastSlotsHtml = ""; // what's in the item slots right now (to skip identical redraws)

// One item slot: the item (locked or the optimizer's pick), or empty. Clicking opens the picker;
// an optimizer pick also gets a small × to ban it straight away.
function slotHtml(slotId: string, content: SlotContent, placeholder: string, label: string): string {
  if (!content) {
    return `<div class="slot-wrap"><button type="button" class="slot empty" data-slot="${slotId}" aria-label="${label}: empty, choose an item">${placeholder}</button></div>`;
  }
  const { item, locked } = content;
  const ban = locked ? "" : `<button type="button" class="slot-ban" data-ban="${escapeHtml(item.name)}" aria-label="Ban ${escapeHtml(item.name)}" data-tip="Ban: never use this item">×</button>`;
  return `
    <div class="slot-wrap">
      <button type="button" class="slot filled${locked ? " locked" : ""}" data-slot="${slotId}"
        aria-label="${label}: ${escapeHtml(item.name)}${locked ? " (locked)" : ""}. Click to change">
        ${itemIconHtml(item, 56)}${locked ? lockIcon : ""}
      </button>
      ${ban}
    </div>`;
}

// The item slots, the Optimize button, the progress bar and the damage total: everything
// that comes from a search result.
function renderResults(): void {
  const full = fullRequest();
  const shown = searches.shownResult(quickRequest(), full);

  // Between a change and its quick answer (~15 ms) there's no result for the new inputs.
  // Blanking everything for that moment made the page shrink and jump back (Eric: disorienting),
  // so the previous answer stays up, faded by "is-updating", until the new one replaces it.
  const resultsPanel = byId("damage-total").closest(".panel");
  // (render() runs just BEFORE the quick search starts, so "an answer is coming" means: there is
  // a quick question to ask and no error. A failed search shows its error instead.)
  const waiting =
    shown === null &&
    selectedBuild.result !== null &&
    quickRequest() !== null &&
    searches.searchStatus.error === null;
  resultsPanel?.classList.toggle("is-updating", waiting);
  byId("item-slots").classList.toggle("is-updating", waiting);
  if (waiting) return;

  if (shown?.result !== selectedBuild.result) selectedBuild = { result: shown?.result ?? null, index: 0 };
  const best = shown ? buildAt(shown.result, selectedBuild.index) : undefined;
  const running = searches.searchStatus.running;

  // The casino roll (slot-roller.ts): free slots spin while Optimize runs. When its answer
  // arrives, the slots land one by one, and only then do the damage and top 5 change.
  const rollingNow = running?.kind === "full" && rollingAllowed();
  if (rollingNow) {
    rollKey = running.key;
  } else if (rollKey !== null) {
    // The search we were rolling for just finished (and wasn't replaced by a change): reveal it.
    const finished = searches.searchStatus.full;
    if (shown?.complete && finished?.key === rollKey && shown.result === finished.result) {
      reveal = { result: shown.result, start: performance.now(), done: false };
    }
    rollKey = null;
  }
  const revealing = reveal !== null && !reveal.done && reveal.result === shown?.result;

  // Slots: always 6. Boots (when on) on the far left, then the items, then switched-off slots.
  const { boots, items: slotItems } = actions.arrangeSlots(state, best?.items);
  let landing = 0; // the how-many-th slot to land (left to right)
  const slot = (slotId: string, content: SlotContent, placeholder: string, label: string, pool: "items" | "boots") => {
    if (content?.locked || !(rollingNow || revealing)) return slotHtml(slotId, content, placeholder, label);
    if (!revealing) return rollingSlotHtml(pool, label);
    if (!content) return slotHtml(slotId, content, placeholder, label);
    landing++;
    return rollingSlotHtml(pool, label, { item: content.item, at: reveal!.start + landing * landGapMs });
  };
  const cells: string[] = [];
  if (state.bootsOn) cells.push(slot("boots", boots, state.midQuest ? "Tier 3" : "Boots", "Boots slot", "boots"));
  slotItems.forEach((content, i) => cells.push(slot(String(i), content, "?", `Item slot ${i + 1}`, "items")));
  while (cells.length < inventory.slots) cells.push(`<div class="slot-wrap"><div class="slot off" aria-hidden="true"></div></div>`);
  // Only rebuild the slots when they changed. Optimize redraws ~100 times while it runs; rebuilding
  // each time made brand-new pictures that hadn't been painted yet, so rolling slots looked empty.
  const slotsHtml = cells.join("");
  if (slotsHtml !== lastSlotsHtml) {
    byId("item-slots").innerHTML = slotsHtml;
    lastSlotsHtml = slotsHtml;
  }

  if (revealing) {
    // Hold everything else until the last slot lands, then draw the whole answer.
    startRolling(() => {
      reveal!.done = true;
      renderResults();
    });
    byId("progress").hidden = true;
    byId<HTMLButtonElement>("optimize").disabled = true;
    return;
  }
  if (rollingNow) startRolling();

  // Optimize: hidden when the quick result already is the whole answer.
  const optimizeButton = byId<HTMLButtonElement>("optimize");
  optimizeButton.hidden = shown?.complete === true && running?.kind !== "full";
  optimizeButton.disabled = full === null || running?.kind === "full";

  // Progress bar, only for Optimize (the quick search is too fast to need one).
  const showProgress = running?.kind === "full";
  byId("progress").hidden = !showProgress;
  if (showProgress) {
    byId("progress-fill").style.width = `${running.fraction * 100}%`;
    byId("progress-text").textContent = progressLabel(running.fraction);
  }

  // Damage total, the top 5 and the breakdowns of the selected build.
  byId("damage-label").textContent = `${selectedAbility().name} damage`;
  const total = byId("damage-total");
  const note = byId("damage-note");
  const problem = actions.conditionProblem(state);
  note.classList.toggle("is-problem", problem !== null);
  if (actions.championSetup(state) === null) {
    showText(total, "—");
    note.textContent = actions.abilityProblem(state) ?? "";
  } else if (problem) {
    showText(total, "—");
    note.textContent = problem;
  } else if (shown && shown.result.builds.length === 0) {
    showText(total, "—");
    note.textContent =
      Object.keys(state.minStats).length > 0
        ? "No build reaches these minimum stats with these locks and bans. Try lowering a minimum."
        : "No build fits these locks and bans. Try unbanning an item.";
  } else if (!best) {
    showText(total, "…");
    note.textContent = "Working it out…";
  } else {
    showTotal(total, best); // counts up from the old number
    const ranking = maximizeNote();
    note.textContent = (shown?.complete ? whatDamageMeans() : "Best first item + boots so far. Optimize fills every slot.") + ranking;
  }
  byId("top-builds").innerHTML = shown && shown.result.builds.length ? topBuildsHtml(shown.result, selectedBuild.index) : "";
  byId("breakdown").innerHTML = best ? breakdownHtml(best) : "";
  renderMinStatHints(best?.items);

  const error = byId("search-error");
  error.hidden = searches.searchStatus.error === null;
  error.textContent = searches.searchStatus.error ?? "";
}

// The big damage number. For an ability that can crit (Yone's Q) it's two numbers, "no crit / crit",
// each in its own colour and counting up on its own (Eric didn't want the average up here).
// At 100% crit chance Q always crits, so only the red crit number is shown; at 0% it can never
// crit, so only the plain no-crit number is shown (Eric).
// Three layouts: "plain" (one number), "pair" (no crit / crit) and "crit" (crit only). When the
// layout changes, the box is emptied and rebuilt; otherwise the numbers just count to their new value.
function showTotal(total: HTMLElement, build: ExplainedBuild): void {
  const crit = build.explanation.crit;
  // At 0% crit chance build.damage is the no-crit number (the peak), so "plain" shows it.
  const layout = !crit || neverCrits(crit) ? "plain" : alwaysCrits(crit) ? "crit" : "pair";
  if (total.dataset.layout !== layout) {
    showText(total, ""); // forget the old number(s), so nothing counts from a different layout
    total.dataset.layout = layout;
    if (layout === "pair") {
      total.innerHTML = `<span class="no-crit" title="No crit"></span><span class="crit-slash">/</span><span class="crit" title="Crit"></span>`;
    } else if (layout === "crit") {
      total.innerHTML = `<span class="crit"></span>`;
    }
  }
  if (layout === "crit") total.querySelector<HTMLElement>(".crit")!.title = alwaysCritTitle(crit!);
  if (!crit || layout === "plain") return countTo(total, build.damage);
  if (layout === "pair") countTo(total.querySelector<HTMLElement>(".no-crit")!, crit.noCrit);
  countTo(total.querySelector<HTMLElement>(".crit")!, crit.crit);
}

// The one-line rule under the damage total, for the selected ability.
// With Max on, the top 5 aren't sorted by damage, so the note says what they're sorted by.
function maximizeNote(): string {
  if (state.maximize.length === 0) return "";
  const labels = state.maximize.map((stat) => panelStatInfo.find((s) => s.key === stat)!.label);
  if (labels.length === 1) return ` Ranked by ${labels[0]}, then damage.`;
  return ` Ranked by ${labels.join(" + ")} (balanced: the weakest share of its best counts), then damage.`;
}

function whatDamageMeans(): string {
  const setup = actions.championSetup(state);
  return setup ? damageRule(setup.champion, setup.ability) : "";
}

function renderDummy(): void {
  // Each enemy type with its champion's icon (the dummy IS that champion: Eric's choice).
  byId("enemy-types").innerHTML = (Object.keys(dummyPresets) as EnemyType[])
    .map((type) => {
      const selected = type === state.enemyType;
      const championId = dummyPresets[type].champion;
      return `
        <button type="button" class="enemy-card${selected ? " selected" : ""}" aria-pressed="${selected}" data-enemy="${type}">
          <img src="${iconPath.champion(championId)}" alt="" width="48" height="48" />
          <span class="enemy-type">${enemyTypeLabels[type]}</span>
          <span class="enemy-champion">${escapeHtml(champions[championId].name)}</span>
        </button>`;
    })
    .join("");

  byId<HTMLInputElement>("dummy-level").value = String(state.dummyLevel);
  byId<HTMLInputElement>("dummy-health").value = String(state.dummyHealthPercent);
  byId<HTMLInputElement>("use-recommended").checked = state.useRecommendedItems;
  renderDummyItems();

  // Each stat box shows the typed number if there is one, otherwise the calculated one (rounded).
  const calculated = actions.calculatedDummy(state);
  const shownStats = {
    "dummy-hp": [state.typedDummyStats.hp, calculated.hp],
    "dummy-armor": [state.typedDummyStats.armor, calculated.baseArmor + calculated.bonusArmor],
    "dummy-magic-resist": [state.typedDummyStats.magicResist, calculated.baseMagicResist + calculated.bonusMagicResist],
  } as const;
  for (const [id, [typed, calc]] of Object.entries(shownStats)) {
    const input = byId<HTMLInputElement>(id);
    input.value = String(typed ?? Math.round(calc));
    input.classList.toggle("typed", typed !== null); // highlighted when it's an override
  }
}

// The dummy's items: the same 6-slot row as the build (boots on the left). Clicking a slot opens
// the item picker. With "Recommended" on, the slots show the recommended items; choosing a
// different one switches to custom items (setDummySlot).
function renderDummyItems(): void {
  const { boots, items: slotNames } = actions.dummySlots(state);
  const slot = (slotId: string, name: string | null, placeholder: string, label: string) =>
    name
      ? `<div class="slot-wrap"><button type="button" class="slot filled" data-dummy-slot="${slotId}" aria-label="${label}: ${escapeHtml(name)}. Click to change">${itemIconHtml(getItem(name), 56)}</button></div>`
      : `<div class="slot-wrap"><button type="button" class="slot empty" data-dummy-slot="${slotId}" aria-label="${label}: empty, choose an item">${placeholder}</button></div>`;
  const cells = [slot("boots", boots, "Boots", "Dummy boots")];
  slotNames.forEach((name, i) => cells.push(slot(String(i), name, "+", `Dummy item ${i + 1}`)));
  while (cells.length < inventory.slots) cells.push(`<div class="slot-wrap"><div class="slot off" aria-hidden="true"></div></div>`);
  byId("dummy-items").innerHTML = `<div class="slot-row"><div class="slots">${cells.join("")}</div></div>`;
}

function openDummyPicker(anchor: HTMLElement, slotId: string): void {
  const { boots, items: slotNames } = actions.dummySlots(state);
  const isBoots = slotId === "boots";
  const slot = isBoots ? "boots" : Number(slotId);
  const current = isBoots ? boots : slotNames[slot as number];
  // The same item can't fill two of the dummy's slots.
  const unavailable = new Map<string, string>();
  slotNames.forEach((name, i) => {
    if (name !== null && i !== slot) unavailable.set(name, `Already in the dummy's item slot ${i + 1}`);
  });
  openItemPicker({
    anchor,
    title: isBoots ? "Dummy's boots" : `Dummy's item slot ${(slot as number) + 1}`,
    items: (isBoots ? dummyBootsNames : dummyLegendaryNames).map(getItem),
    unavailable,
    current: current ? { item: getItem(current), locked: false } : null,
    forDummy: true,
    onLock: (name) => update((s) => actions.setDummySlot(s, slot, name)),
    onUnlock: () => update((s) => actions.setDummySlot(s, slot, null)),
    onBan: () => {},
  });
}

// ---- The item picker (clicking a slot) ----

function openSlotPicker(anchor: HTMLElement, slotId: string): void {
  const { boots, items: slotItems } = actions.arrangeSlots(state, currentBest()?.items);
  const banned = new Set(state.banned);
  const lockedElsewhere = (slot: number) =>
    state.locked.slice(0, state.itemCount).flatMap((name, i) => (name !== null && i !== slot ? [{ name, slot: i }] : []));

  if (slotId === "boots") {
    const others = lockedElsewhere(-1);
    const unavailable = new Map<string, string>();
    for (const b of bootsPool(actions.bootsSetting(state))) {
      const clash = others.find((o) => !canBeBuiltTogether(b.name, o.name));
      if (clash) unavailable.set(b.name, `Can't be built with ${clash.name}`);
    }
    openItemPicker({
      anchor,
      title: "Boots slot",
      items: bootsPool(actions.bootsSetting(state)).filter((b) => !banned.has(b.name)),
      unavailable,
      current: boots,
      onLock: (name) => update((s) => actions.lockBoots(s, name)),
      onUnlock: () => update(actions.unlockBoots),
      onBan: (name) => update((s) => actions.banItem(s, name)),
    });
    return;
  }

  const slot = Number(slotId);
  const others = lockedElsewhere(slot);
  const unavailable = new Map<string, string>();
  for (const item of lockableLegendaries()) {
    const sameItem = others.find((o) => o.name === item.name);
    if (sameItem) {
      unavailable.set(item.name, `Already locked in item slot ${sameItem.slot + 1}`);
      continue;
    }
    const clash = [...others.map((o) => o.name), ...(state.bootsOn && state.lockedBoots ? [state.lockedBoots] : [])].find(
      (name) => !canBeBuiltTogether(item.name, name),
    );
    if (clash) unavailable.set(item.name, `Can't be built with ${clash} (same item group)`);
  }
  openItemPicker({
    anchor,
    title: `Item slot ${slot + 1}`,
    items: lockableLegendaries().filter((i) => !banned.has(i.name)).sort(byName),
    unavailable,
    current: slotItems[slot] ?? null,
    onLock: (name) => update((s) => actions.lockItem(s, slot, name)),
    onUnlock: () => update((s) => actions.unlockSlot(s, slot)),
    onBan: (name) => update((s) => actions.banItem(s, name)),
  });
}

function currentBest(): { items: Item[] } | undefined {
  const shown = searches.shownResult(quickRequest(), fullRequest());
  return shown ? buildAt(shown.result, selectedBuild.index) : undefined;
}

// ---- Opening the page ----

// Draws the page inside `root` and wires up its buttons. Returns a "clean-up" function that
// the router calls when you leave the page.
//
// Buttons that are redrawn every time (rank pips, stage buttons, slots...) carry `data-`
// attributes saying what they do. One listener on the page reads them: "event delegation", so we
// never have to re-attach listeners after a redraw. The listeners hang on `root`, which is thrown
// away when you leave the page, so they go with it.
export function mountChampionPage(root: HTMLElement, slug: string, ability: AbilityKey | null, navigate: (path: string) => void): () => void {
  const name = championList.find((c) => c.slug === slug)?.name ?? slug;
  if (!isPlayableChampion(slug)) {
    root.innerHTML = comingSoonHtml(slug, name, ability);
    // Clicking an ability changes the address (/aatrox/q), which redraws this page with it picked.
    root.addEventListener("click", (event) => {
      const key = (event.target as HTMLElement).closest<HTMLElement>("[data-ability]")?.dataset.ability;
      if (key) navigate(paths.champion(slug, key as AbilityKey));
    });
    return () => {};
  }

  const champion = slug;
  // /katarina with no ability opens R (Death Lotus, the ability the site started with).
  const modelled = modelledAbilities[champion];
  state = actions.selectAbility(actions.selectChampion(state, champion), ability ?? (modelled.includes("r") ? "r" : modelled[0]));
  root.innerHTML = pageHtml(slug, name);
  lastSlotsHtml = ""; // fresh, empty slots: the first render must draw them
  // Every legendary and boots the casino roll can flash through (loaded now, so it never blinks).
  setRollPools(lockableLegendaries(), [...bootsPool("tier2"), ...bootsPool("tier3")]);

  root.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.disabled) return;
    const data = button.dataset;

    if (data.stepFor) {
      // ▲ / ▼ next to a number box: change the number (kept between the box's min and max), then
      // fire "change" so it's handled exactly like a typed number.
      const input = byId<HTMLInputElement>(data.stepFor);
      const size = Number(input.dataset.stepSize) * Number(data.stepBy);
      const min = input.min === "" ? -Infinity : Number(input.min);
      const max = input.max === "" ? Infinity : Number(input.max);
      const current = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0;
      input.value = String(Math.min(max, Math.max(min, current + size)));
      input.dispatchEvent(new Event("change"));
    } else if (data.slot !== undefined) {
      openSlotPicker(button, data.slot);
    } else if (data.dummySlot !== undefined) {
      openDummyPicker(button, data.dummySlot);
    } else if (data.ban) {
      update((s) => actions.banItem(s, data.ban!));
    } else if (data.unban) {
      update((s) => actions.unbanItem(s, data.unban!));
    } else if (button.id === "clear-conditions") {
      update(actions.clearConditions);
    } else if (button.id === "clear-min-stats") {
      update(actions.clearMinStats);
    } else if (data.maximize) {
      update((s) => actions.toggleMaximize(s, data.maximize as PanelStat));
    } else if (data.rankOf) {
      update((s) => actions.setRank(s, data.rankOf as AbilityKey, Number(data.rank)));
    } else if (data.ability) {
      navigate(paths.champion(slug, data.ability as AbilityKey)); // the address says which ability
    } else if (data.stage) {
      update((s) => actions.applyStage(s, data.stage as StageName));
    } else if (data.enemy) {
      update((s) => actions.setEnemyType(s, data.enemy as EnemyType));
    } else if (button.id === "add-slot") {
      update((s) => actions.changeItemCount(s, +1));
    } else if (button.id === "remove-slot") {
      update((s) => actions.changeItemCount(s, -1));
    } else if (button.id === "reset-stats") {
      update(actions.clearTypedStats);
    } else if (data.buildIndex) {
      // A top-5 card: show that build. Nothing about the inputs changed, so only the results redraw.
      selectedBuild.index = Number(data.buildIndex);
      renderResults();
    } else if (button.id === "optimize") {
      const full = fullRequest();
      if (full) searches.optimize(full);
    }
  });

  // Number boxes use the "change" event, which fires when you press Enter or leave the box,
  // not on every key. So typing "12" doesn't first set the level to 1.
  byId<HTMLInputElement>("level").addEventListener("change", (event) => {
    const value = readNumber(event.target as HTMLInputElement);
    update((s) => (value === null ? s : actions.setLevel(s, value)));
  });
  byId<HTMLInputElement>("dummy-level").addEventListener("change", (event) => {
    const value = readNumber(event.target as HTMLInputElement);
    update((s) => (value === null ? s : actions.setDummyLevel(s, value)));
  });

  byId<HTMLInputElement>("dummy-health").addEventListener("change", (event) => {
    update((s) => actions.setDummyHealthPercent(s, readNumber(event.target as HTMLInputElement)));
  });

  const statBoxes = { "dummy-hp": "hp", "dummy-armor": "armor", "dummy-magic-resist": "magicResist" } as const;
  for (const [id, stat] of Object.entries(statBoxes)) {
    byId<HTMLInputElement>(id).addEventListener("change", (event) => {
      update((s) => actions.setTypedStat(s, stat, readNumber(event.target as HTMLInputElement)));
    });
  }

  // A minimum stat box: the typed number in the box's unit (crit in %), stored as the stat's own
  // value (crit as a fraction). Empty = no minimum.
  for (const info of panelStatInfo) {
    byId<HTMLInputElement>(`min-${info.key}`).addEventListener("change", (event) => {
      const value = readNumber(event.target as HTMLInputElement);
      update((s) => actions.setMinStat(s, info.key, value === null ? null : value / info.shownAs));
    });
  }

  byId<HTMLInputElement>("boots-on").addEventListener("change", (event) => {
    update((s) => actions.setBootsOn(s, (event.target as HTMLInputElement).checked));
  });
  byId<HTMLInputElement>("mid-quest").addEventListener("change", (event) => {
    update((s) => actions.setMidQuest(s, (event.target as HTMLInputElement).checked));
  });
  byId<HTMLInputElement>("use-recommended").addEventListener("change", (event) => {
    update((s) => actions.setUseRecommendedItems(s, (event.target as HTMLInputElement).checked));
  });

  // When a search starts, moves the progress bar or finishes, redraw only the results part.
  // (Redrawing the whole page ~100 times during Optimize would wipe out a number half-typed in a box.)
  searches.onSearchChange(renderResults);

  // First draw, and the first quick search.
  update((s) => s);

  // Leaving the page: a search that finishes later must not try to draw on a page that's gone,
  // and an open item picker closes.
  return () => {
    searches.onSearchChange(() => {});
    closeItemPicker();
    stopRolling();
    rollKey = null;
    reveal = null;
  };
}
