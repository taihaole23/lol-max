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
import { modelledAbilities, playableChampions, type AbilityKey, type PlayableChampionId } from "../../data/playable-champions.ts";
import { stages, type StageName } from "../../data/stages.ts";
import { lockableLegendaries } from "../../optimizer/constraints.ts";
import { bootsPool } from "../../optimizer/item-pool.ts";
import { canBeBuiltTogether } from "../../optimizer/legal.ts";
import type { SearchResult } from "../../optimizer/messages.ts";
import { maxItemCount } from "../../optimizer/setup.ts";
import { allowedRRanks } from "../../stats/katarina-stats.ts";
import { isPlayable } from "../champion-search.ts";
import { byId, escapeHtml, readNumber } from "../html.ts";
import { iconPath, itemIconHtml } from "../icons.ts";
import { closeItemPicker, openItemPicker } from "../item-picker.ts";
import { progressLabel } from "../progress.ts";
import { countTo, showText } from "../count-up.ts";
import { breakdownHtml, buildAt, topBuildsHtml } from "../results-view.ts";
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

// ---- The page's HTML (filled in by the render functions below) ----

function pageHtml(slug: string, name: string): string {
  return `
    <!-- Splash art behind the header, fading into the page (decoration only). -->
    <div class="champ-splash" style="background-image:url('${iconPath.splash(slug)}')" aria-hidden="true"></div>
    <section class="champ-hero">
      <img class="champ-portrait" src="${iconPath.champion(slug)}" alt="" width="96" height="96" />
      <div>
        <h1 class="champ-name">${escapeHtml(name)}</h1>
        <p id="champ-sub" class="champ-sub"></p>
      </div>
    </section>

    <nav id="abilities" class="ability-bar" aria-label="Abilities"></nav>

    <!-- Shown when an ability that isn't modelled yet is selected. -->
    <section id="coming-soon" class="panel empty-state" hidden>
      <h2>Coming soon</h2>
      <p>This ability isn't modelled yet. Death Lotus (R) is the one the site calculates today.</p>
    </section>

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

        <p id="r-locked" class="notice" hidden>Death Lotus unlocks at level 6.</p>

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
      </div>

      <div class="panel results">
        <header class="results-head">
          <div>
            <span class="field-label">Death Lotus damage</span>
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

// A champion the site can't calculate yet.
function comingSoonHtml(slug: string, name: string): string {
  return `
    <section class="champ-hero">
      <img class="champ-portrait" src="${iconPath.champion(slug)}" alt="" width="96" height="96" />
      <div>
        <h1 class="champ-name">${escapeHtml(name)}</h1>
        <p class="champ-sub">Coming soon</p>
      </div>
    </section>
    <section class="panel empty-state">
      <h2>${escapeHtml(name)} isn't modelled yet</h2>
      <p>Right now the site calculates ${Object.values(playableChampions)
        .map((c) => `<a href="${paths.champion(championList.find((x) => x.name === c.name)?.slug ?? "")}">${escapeHtml(c.name)}</a>`)
        .join(", ")}. More champions are on the way.</p>
    </section>`;
}

// ---- Drawing the page ----

function render(): void {
  renderAbilities();
  const modelled = modelledAbilities[state.champion].includes(state.ability);
  byId("optimizer").hidden = !modelled;
  byId("coming-soon").hidden = modelled;
  renderSetup();
  renderDummy();
  renderResults();
}

function renderAbilities(): void {
  const champion = playableChampions[state.champion];
  const selected = champion.abilities.find((a) => a.key === state.ability);
  byId("champ-sub").textContent = selected ? `${selected.name} (${selected.key.toUpperCase()})` : "";

  byId("abilities").innerHTML = champion.abilities
    .map((ability) => {
      const isSelected = ability.key === state.ability;
      const modelled = modelledAbilities[state.champion].includes(ability.key);
      const rank = state.ranks[ability.key];

      // One pip per rank. Filled = ranks you have. R's pips above what the level allows are disabled.
      const pips = [];
      for (let pip = 1; pip <= ability.maxRank; pip++) {
        const filled = pip <= rank ? " filled" : "";
        const allowed = ability.key !== "r" || allowedRRanks(state.level).some((r) => r === pip);
        pips.push(
          `<button type="button" class="rank-pip${filled}" data-rank-of="${ability.key}" data-rank="${pip}"` +
            ` aria-label="${escapeHtml(ability.name)} rank ${pip}"${allowed ? "" : " disabled"}></button>`,
        );
      }

      const tip = modelled ? ability.name : `${ability.name} · coming soon`;
      return `
        <div class="ability${isSelected ? " selected" : ""}${modelled ? "" : " unavailable"}">
          <button type="button" class="ability-icon" data-ability="${ability.key}" data-tip="${escapeHtml(tip)}"
            aria-label="${escapeHtml(tip)}" aria-pressed="${isSelected}">
            <img src="${iconPath.ability(state.champion, ability.key)}" alt="" width="84" height="84" />
            <span class="ability-key">${ability.key.toUpperCase()}</span>
          </button>
          <div class="rank-pips">${pips.join("")}</div>
        </div>`;
    })
    .join("");
}

function renderSetup(): void {
  byId("setup-summary").textContent = `Level ${state.level} · R rank ${state.ranks.r || "—"}`;

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

  byId("r-locked").hidden = actions.katarinaSetup(state) !== null;
  byId<HTMLButtonElement>("remove-slot").disabled = state.itemCount <= 1;
  byId<HTMLButtonElement>("add-slot").disabled = state.itemCount >= maxItemCount(actions.bootsSetting(state));
  renderConditions();
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
  const total = byId("damage-total");
  const note = byId("damage-note");
  const problem = actions.conditionProblem(state);
  note.classList.toggle("is-problem", problem !== null);
  if (actions.katarinaSetup(state) === null) {
    showText(total, "—");
    note.textContent = "Death Lotus unlocks at level 6.";
  } else if (problem) {
    showText(total, "—");
    note.textContent = problem;
  } else if (shown && shown.result.builds.length === 0) {
    showText(total, "—");
    note.textContent = "No build fits these locks and bans. Try unbanning an item.";
  } else if (!best) {
    showText(total, "…");
    note.textContent = "Working it out…";
  } else {
    countTo(total, best.damage); // counts up from the old number
    note.textContent = shown?.complete
      ? "One full ult, all 15 daggers on the dummy."
      : "Best first item + boots so far. Optimize fills every slot.";
  }
  byId("top-builds").innerHTML = shown && shown.result.builds.length ? topBuildsHtml(shown.result, selectedBuild.index) : "";
  byId("breakdown").innerHTML = best ? breakdownHtml(best) : "";

  const error = byId("search-error");
  error.hidden = searches.searchStatus.error === null;
  error.textContent = searches.searchStatus.error ?? "";
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
  if (!isPlayable(slug)) {
    root.innerHTML = comingSoonHtml(slug, name);
    return () => {};
  }

  const champion = slug as PlayableChampionId;
  state = { ...state, champion, ability: ability ?? modelledAbilities[champion][0] };
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

  const statBoxes = { "dummy-hp": "hp", "dummy-armor": "armor", "dummy-magic-resist": "magicResist" } as const;
  for (const [id, stat] of Object.entries(statBoxes)) {
    byId<HTMLInputElement>(id).addEventListener("change", (event) => {
      update((s) => actions.setTypedStat(s, stat, readNumber(event.target as HTMLInputElement)));
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
