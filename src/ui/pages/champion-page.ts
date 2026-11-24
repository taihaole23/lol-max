// A champion's page: /katarina, /katarina/r ...
//
// How it works:
//   1. `state` (src/ui/state.ts) holds everything the user has picked.
//   2. When the user clicks or types, we call a state function to get a new state...
//   3. ...and call `render()`, which redraws the page from the state.
// The page never stores anything the state doesn't have, so it can't get out of sync.
// `state` lives outside the page, so going to "How it works" and back keeps your settings.
import { champions } from "../../data/champions.ts";
import { championList } from "../../data/champion-list.ts";
import { dummyPresets, type EnemyType } from "../../data/dummy-presets.ts";
import { inventory } from "../../data/game-rules.ts";
import { getItem, items, type Item } from "../../data/items.ts";
import { modelledAbilities, playableChampions, type AbilityKey, type PlayableChampionId } from "../../data/playable-champions.ts";
import { stages, type StageName } from "../../data/stages.ts";
import type { SearchResult } from "../../optimizer/messages.ts";
import { maxItemCount } from "../../optimizer/setup.ts";
import { allowedRRanks } from "../../stats/katarina-stats.ts";
import { isPlayable } from "../champion-search.ts";
import { byId, escapeHtml, readNumber } from "../html.ts";
import { iconPath, itemIconHtml } from "../icons.ts";
import { progressLabel } from "../progress.ts";
import { breakdownHtml, formatDamage, topBuildsHtml } from "../results-view.ts";
import { paths } from "../router.ts";
import * as searches from "../searches.ts";
import * as actions from "../state.ts";
import type { PageState } from "../state.ts";

let state: PageState = actions.initialState();

// The two questions the current inputs ask: the quick one (1 item + boots) and the full one.
const quickRequest = () => actions.searchRequest(state, 1);
const fullRequest = () => actions.searchRequest(state, state.itemCount);

// Every change goes through here: work out the new state, redraw, and let the searches know.
// (inputsChanged starts a quick search if the answer is out of date; it redraws when done.)
function update(change: (old: PageState) => PageState): void {
  state = change(state);
  render();
  searches.inputsChanged(quickRequest(), fullRequest());
}

// ---- Labels shown on the page ----

const stageLabels: Record<StageName, string> = { early: "Early", mid: "Mid", late: "Late", full: "Full" };
const enemyTypeLabels: Record<EnemyType, string> = { squishy: "Squishy", bruiser: "Bruiser", tank: "Tank" };

// The dummy's item picker lists every legendary and support item, and every tier-2 boots, A to Z.
// Support items are included because a support dummy (Nami) buys one, like Dream Maker.
const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
const legendaryNames = items
  .filter((i) => i.category === "legendary" || i.category === "support")
  .sort(byName)
  .map((i) => i.name);
const bootsNames = items.filter((i) => i.category === "boots").sort(byName).map((i) => i.name);

// ---- The page's HTML (filled in by the render functions below) ----

function pageHtml(slug: string, name: string): string {
  return `
    <section class="champion-header">
      <img class="champion-icon" src="${iconPath.champion(slug)}" alt="" width="64" height="64" />
      <h1>${escapeHtml(name)}</h1>
    </section>

    <section aria-label="Abilities">
      <div id="abilities" class="ability-row"></div>
    </section>

    <!-- Shown when an ability that isn't modelled yet is selected. -->
    <section id="coming-soon" class="panel" hidden>
      <p>This ability isn't modelled yet. Only Death Lotus (R) works in version 1.</p>
    </section>

    <section id="optimizer" class="optimizer">
      <div class="panel">
        <h2 id="attacker-title"></h2>

        <div class="field">
          <span class="field-label">Stage preset</span>
          <div id="stage-buttons" class="button-row"></div>
        </div>

        <label class="field">
          <span class="field-label">Level</span>
          <input id="level" type="number" min="1" max="18" step="1" />
        </label>

        <label class="check"><input id="boots-on" type="checkbox" /> Boots</label>
        <label class="check"><input id="mid-quest" type="checkbox" /> Mid quest completed (tier-3 boots)</label>

        <p id="r-locked" class="warning" hidden>Death Lotus unlocks at level 6.</p>

        <div class="field">
          <span class="field-label">Item slots</span>
          <!-- Always 6 slots wide, so the − / + buttons never move. -->
          <div class="slot-row">
            <div id="item-slots" class="slots"></div>
            <div class="slot-buttons">
              <button id="remove-slot" type="button" aria-label="Remove a slot">−</button>
              <button id="add-slot" type="button" aria-label="Add a slot">+</button>
            </div>
          </div>
        </div>

        <button id="optimize" type="button" class="primary">Optimize</button>
        <div id="progress" class="progress" hidden>
          <div id="progress-fill" class="progress-fill"></div>
          <span id="progress-text" class="progress-text"></span>
        </div>
      </div>

      <div class="panel">
        <h2>Target dummy</h2>

        <div class="field">
          <span class="field-label">Enemy type</span>
          <div id="enemy-types" class="button-row"></div>
        </div>

        <label class="field">
          <span class="field-label">Dummy level</span>
          <input id="dummy-level" type="number" min="1" max="18" step="1" />
        </label>

        <label class="check"><input id="use-recommended" type="checkbox" /> Use recommended items</label>
        <div id="dummy-items" class="dummy-items"></div>

        <div class="stat-row">
          <label class="field"><span class="field-label">HP</span><input id="dummy-hp" type="number" min="1" /></label>
          <label class="field"><span class="field-label">Armor</span><input id="dummy-armor" type="number" min="0" /></label>
          <label class="field"><span class="field-label">MR</span><input id="dummy-magic-resist" type="number" min="0" /></label>
        </div>
        <p class="hint">Type a number to override it. <button id="reset-stats" type="button" class="link-button">Reset to calculated</button></p>
      </div>

      <div class="panel results">
        <h2>Damage</h2>
        <p id="damage-total" class="damage-total"></p>
        <p id="damage-note" class="hint"></p>
        <p id="search-error" class="warning" hidden></p>
        <div id="top-builds"></div>
        <div id="breakdown"></div>
        <p class="hint">How the numbers are worked out, and every source: <a href="${paths.about}">How it works</a>.</p>
      </div>
    </section>`;
}

// A champion the site can't calculate yet.
function comingSoonHtml(slug: string, name: string): string {
  return `
    <section class="champion-header">
      <img class="champion-icon" src="${iconPath.champion(slug)}" alt="" width="64" height="64" />
      <h1>${escapeHtml(name)}</h1>
    </section>
    <section class="panel">
      <p><strong>Coming soon.</strong> ${escapeHtml(name)}'s abilities aren't modelled yet.</p>
      <p class="hint">Right now the site calculates ${Object.values(playableChampions)
        .map((c) => escapeHtml(c.name))
        .join(", ")}. Try the search bar above.</p>
    </section>`;
}

// ---- Drawing the page ----

function render(): void {
  renderAbilities();
  const modelled = modelledAbilities[state.champion].includes(state.ability);
  byId("optimizer").hidden = !modelled;
  byId("coming-soon").hidden = modelled;
  renderKatarina();
  renderDummy();
  renderResults();
}

function renderAbilities(): void {
  const champion = playableChampions[state.champion];
  byId("abilities").innerHTML = champion.abilities
    .map((ability) => {
      const selected = ability.key === state.ability ? " selected" : "";
      const modelled = modelledAbilities[state.champion].includes(ability.key);
      const rank = state.ranks[ability.key];

      // One box per rank. Filled = ranks you have. R's boxes above what the level allows are disabled.
      const boxes = [];
      for (let box = 1; box <= ability.maxRank; box++) {
        const filled = box <= rank ? " filled" : "";
        const allowed = ability.key !== "r" || allowedRRanks(state.level).some((r) => r === box);
        boxes.push(
          `<button type="button" class="rank-box${filled}" data-rank-of="${ability.key}" data-rank="${box}"` +
            ` aria-label="${escapeHtml(ability.name)} rank ${box}"${allowed ? "" : " disabled"}></button>`,
        );
      }

      // The icon, with the key (Q/W/E/R) in the corner and the name on hover.
      const tip = modelled ? ability.name : `${ability.name} (coming soon)`;
      return `
        <div class="ability${selected}${modelled ? "" : " unavailable"}">
          <button type="button" class="ability-card" data-ability="${ability.key}" data-tip="${escapeHtml(tip)}" aria-label="${escapeHtml(tip)}">
            <img src="${iconPath.ability(state.champion, ability.key)}" alt="" width="56" height="56" />
            <span class="ability-key">${ability.key.toUpperCase()}</span>
          </button>
          <div class="rank-boxes">${boxes.join("")}</div>
        </div>`;
    })
    .join("");
}

function renderKatarina(): void {
  byId("attacker-title").textContent = playableChampions[state.champion].name;

  byId("stage-buttons").innerHTML = (Object.keys(stages) as StageName[])
    .map((stage) => {
      const selected = stage === state.stage ? " selected" : "";
      return `<button type="button" class="${selected}" data-stage="${stage}">${stageLabels[stage]}</button>`;
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
}

// A filled item slot: the item's icon, its name on hover.
function itemSlotHtml(item: Item, extraClass = ""): string {
  return `<div class="slot filled ${extraClass}">${itemIconHtml(item, 48)}</div>`;
}

// Which of the top 5 is shown. It belongs to one result: a new result starts again at #1.
let selectedBuild: { result: SearchResult | null; index: number } = { result: null, index: 0 };

// The item slots, the Optimize button, the progress bar and the damage total: everything
// that comes from a search result.
function renderResults(): void {
  const full = fullRequest();
  const shown = searches.shownResult(quickRequest(), full);
  if (shown?.result !== selectedBuild.result) selectedBuild = { result: shown?.result ?? null, index: 0 };
  const best = shown?.result.builds[selectedBuild.index];
  const running = searches.searchStatus.running;

  // Slots: always 6. Boots (when on) on the far left, then the items, then switched-off slots
  // greyed out. An active slot the quick result doesn't fill yet shows "?".
  const legendaries = best?.items.filter((item) => item.category === "legendary") ?? [];
  const boots = best?.items.find((item) => item.category === "boots" || item.category === "boots-tier-3");
  const slots: string[] = [];
  if (state.bootsOn) slots.push(boots ? itemSlotHtml(boots, "boots") : `<div class="slot boots">${state.midQuest ? "Tier 3" : "Boots"}</div>`);
  for (let i = 0; i < state.itemCount; i++) slots.push(legendaries[i] ? itemSlotHtml(legendaries[i]) : `<div class="slot">?</div>`);
  while (slots.length < inventory.slots) slots.push(`<div class="slot off" aria-hidden="true"></div>`);
  byId("item-slots").innerHTML = slots.join("");

  // Optimize: hidden when there's only 1 slot (the quick result already is the answer).
  const optimizeButton = byId<HTMLButtonElement>("optimize");
  optimizeButton.hidden = state.itemCount === 1;
  optimizeButton.disabled = full === null || running?.kind === "full" || shown?.complete === true;

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
  if (full === null) {
    total.textContent = "";
    note.textContent = "Death Lotus unlocks at level 6.";
  } else if (!best) {
    total.textContent = "…";
    note.textContent = "Working it out…";
  } else {
    total.textContent = `${formatDamage(best.damage)} damage`;
    note.textContent = shown?.complete
      ? "One full Death Lotus, every dagger hitting the dummy."
      : "Best first item + boots so far. Press Optimize to fill every slot.";
  }
  byId("top-builds").innerHTML = shown ? topBuildsHtml(shown.result.builds, selectedBuild.index) : "";
  byId("breakdown").innerHTML = best ? breakdownHtml(best) : "";

  const error = byId("search-error");
  error.hidden = searches.searchStatus.error === null;
  error.textContent = searches.searchStatus.error ?? "";
}

function renderDummy(): void {
  // Each enemy type with its champion's icon (the dummy IS that champion: Eric's choice).
  byId("enemy-types").innerHTML = (Object.keys(dummyPresets) as EnemyType[])
    .map((type) => {
      const selected = type === state.enemyType ? " selected" : "";
      const championId = dummyPresets[type].champion;
      const championName = escapeHtml(champions[championId].name);
      return `
        <button type="button" class="enemy-card${selected}" data-enemy="${type}">
          <img src="${iconPath.champion(championId)}" alt="" width="44" height="44" />
          <span class="enemy-type">${enemyTypeLabels[type]}</span>
          <span class="enemy-champion">${championName}</span>
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

function renderDummyItems(): void {
  const container = byId("dummy-items");
  if (state.useRecommendedItems) {
    // A row of icons (boots first), names on hover.
    const icons = actions.dummyItems(state).map((item) => itemIconHtml(item, 36));
    container.innerHTML = `<div class="icon-row">${icons.join("")}</div>`;
    return;
  }

  // The custom picker: one drop-down per legendary slot, plus one for boots.
  const options = (names: string[], chosen: string | null, emptyLabel: string) =>
    [`<option value="">${emptyLabel}</option>`]
      .concat(
        names.map((name) => {
          const selected = name === chosen ? " selected" : "";
          return `<option value="${escapeHtml(name)}"${selected}>${escapeHtml(name)}</option>`;
        }),
      )
      .join("");

  // Each drop-down has the chosen item's icon beside it (an empty square when nothing is chosen).
  // Boots first, like the item slots.
  const pickerRow = (chosen: string | null, select: string) =>
    `<div class="picker-row">${chosen ? itemIconHtml(getItem(chosen), 28) : `<span class="icon-placeholder"></span>`}${select}</div>`;
  const boots = state.customDummyItems.boots;
  const rows = [pickerRow(boots, `<select data-dummy-boots aria-label="Dummy boots">${options(bootsNames, boots, "(no boots)")}</select>`)];
  for (let slot = 0; slot < actions.dummyItemSlots(state); slot++) {
    const chosen = state.customDummyItems.legendaries[slot] ?? null;
    rows.push(pickerRow(chosen, `<select data-dummy-slot="${slot}" aria-label="Dummy item ${slot + 1}">${options(legendaryNames, chosen, "(empty)")}</select>`));
  }
  container.innerHTML = rows.join("");
}

// ---- Opening the page ----

// Draws the page inside `root` and wires up its buttons. Returns a "clean-up" function that
// the router calls when you leave the page.
//
// Buttons that are redrawn every time (rank boxes, stage buttons...) carry `data-` attributes
// saying what they do. One listener on the page reads them: "event delegation", so we never
// have to re-attach listeners after a redraw. The listeners hang on `root`, which is thrown
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

  root.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest("button");
    if (!button || button.disabled) return;
    const data = button.dataset;

    if (data.rankOf) {
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

  // The dummy's drop-downs are redrawn each time, so they use delegation too.
  byId("dummy-items").addEventListener("change", (event) => {
    const select = event.target as HTMLSelectElement;
    const itemName = select.value === "" ? null : select.value;
    if (select.dataset.dummySlot !== undefined) {
      update((s) => actions.setCustomDummyItem(s, Number(select.dataset.dummySlot), itemName));
    } else if (select.dataset.dummyBoots !== undefined) {
      update((s) => actions.setCustomDummyBoots(s, itemName));
    }
  });

  // When a search starts, moves the progress bar or finishes, redraw only the results part.
  // (Redrawing the whole page ~100 times during Optimize would wipe out a number half-typed in a box.)
  searches.onSearchChange(renderResults);

  // First draw, and the first quick search.
  update((s) => s);

  // Leaving the page: a search that finishes later must not try to draw on a page that's gone.
  return () => searches.onSearchChange(() => {});
}
