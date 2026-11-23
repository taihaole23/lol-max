// Entry point: the browser runs this file first (index.html loads it).
//
// How the page works:
//   1. `state` (src/ui/state.ts) holds everything the user has picked.
//   2. When the user clicks or types, we call a state function to get a new state...
//   3. ...and call `render()`, which redraws the page from the state.
// The page never stores anything the state doesn't have, so it can't get out of sync.
import "./style.css";
import { champions } from "./data/champions.ts";
import { dummyPresets, type EnemyType } from "./data/dummy-presets.ts";
import { items } from "./data/items.ts";
import { modelledAbilities, playableChampions, type AbilityKey } from "./data/playable-champions.ts";
import { stages, type StageName } from "./data/stages.ts";
import type { SearchResult } from "./optimizer/messages.ts";
import { maxItemCount } from "./optimizer/setup.ts";
import { allowedRRanks } from "./stats/katarina-stats.ts";
import { byId, escapeHtml, readNumber } from "./ui/html.ts";
import { progressLabel } from "./ui/progress.ts";
import { breakdownHtml, formatDamage, topBuildsHtml } from "./ui/results-view.ts";
import * as searches from "./ui/searches.ts";
import * as actions from "./ui/state.ts";
import type { PageState } from "./ui/state.ts";

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

// ---- Drawing the page ----

function render(): void {
  renderChampions();
  renderAbilities();
  const modelled = modelledAbilities[state.champion].includes(state.ability);
  byId("optimizer").hidden = !modelled;
  byId("coming-soon").hidden = modelled;
  renderKatarina();
  renderDummy();
  renderResults();
}

function renderChampions(): void {
  byId("champions").innerHTML = Object.entries(playableChampions)
    .map(([id, champion]) => {
      const selected = id === state.champion ? " selected" : "";
      return `<button type="button" class="champion-card${selected}" data-champion="${id}">${escapeHtml(champion.name)}</button>`;
    })
    .join("");
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
          `<button type="button" class="rank-box${filled}" data-ability="${ability.key}" data-rank="${box}"` +
            ` aria-label="${escapeHtml(ability.name)} rank ${box}"${allowed ? "" : " disabled"}></button>`,
        );
      }

      return `
        <div class="ability${selected}">
          <button type="button" class="ability-card" data-ability="${ability.key}">
            <span class="ability-key">${ability.key.toUpperCase()}</span>
            <span class="ability-name">${escapeHtml(ability.name)}</span>
            ${modelled ? "" : `<span class="soon">coming soon</span>`}
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

// The item slots, the Optimize button, the progress bar and the damage total: everything
// that comes from a search result.
// Which of the top 5 is shown. It belongs to one result: a new result starts again at #1.
let selectedBuild: { result: SearchResult | null; index: number } = { result: null, index: 0 };

function renderResults(): void {
  const full = fullRequest();
  const shown = searches.shownResult(quickRequest(), full);
  if (shown?.result !== selectedBuild.result) selectedBuild = { result: shown?.result ?? null, index: 0 };
  const best = shown?.result.builds[selectedBuild.index];
  const running = searches.searchStatus.running;

  // Slots: the best build's items, "?" where the quick result doesn't reach yet.
  const legendaries = best?.items.filter((item) => item.category === "legendary") ?? [];
  const boots = best?.items.find((item) => item.category === "boots" || item.category === "boots-tier-3");
  const slot = (name: string | undefined, extraClass: string, placeholder: string) =>
    name === undefined
      ? `<div class="slot ${extraClass}">${placeholder}</div>`
      : `<div class="slot filled ${extraClass}" title="${escapeHtml(name)}">${escapeHtml(name)}</div>`;
  const slots = [];
  for (let i = 0; i < state.itemCount; i++) slots.push(slot(legendaries[i]?.name, "", "?"));
  if (state.bootsOn) slots.push(slot(boots?.name, "boots", state.midQuest ? "Tier-3 boots" : "Boots"));
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
  byId("enemy-types").innerHTML = (Object.keys(dummyPresets) as EnemyType[])
    .map((type) => {
      const selected = type === state.enemyType ? " selected" : "";
      const championName = champions[dummyPresets[type].champion].name;
      return `<button type="button" class="${selected}" data-enemy="${type}">${enemyTypeLabels[type]} (${championName})</button>`;
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
    const names = actions.dummyItems(state).map((item) => `<li>${escapeHtml(item.name)}</li>`);
    container.innerHTML = `<ul class="item-list">${names.join("")}</ul>`;
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

  const selects = [];
  for (let slot = 0; slot < actions.dummyItemSlots(state); slot++) {
    const chosen = state.customDummyItems.legendaries[slot] ?? null;
    selects.push(`<select data-dummy-slot="${slot}" aria-label="Dummy item ${slot + 1}">${options(legendaryNames, chosen, "(empty)")}</select>`);
  }
  selects.push(`<select data-dummy-boots aria-label="Dummy boots">${options(bootsNames, state.customDummyItems.boots, "(no boots)")}</select>`);
  container.innerHTML = selects.join("");
}

// ---- Reacting to the user ----
// Buttons that are redrawn every time (rank boxes, stage buttons...) carry `data-` attributes
// saying what they do. One listener on the whole page reads them: this is called "event
// delegation", and it means we never have to re-attach listeners after a redraw.

document.addEventListener("click", (event) => {
  const button = (event.target as HTMLElement).closest("button");
  if (!button || button.disabled) return;
  const data = button.dataset;

  if (data.rank && data.ability) {
    update((s) => actions.setRank(s, data.ability as AbilityKey, Number(data.rank)));
  } else if (data.ability) {
    update((s) => actions.selectAbility(s, data.ability as AbilityKey));
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
  const name = select.value === "" ? null : select.value;
  if (select.dataset.dummySlot !== undefined) {
    update((s) => actions.setCustomDummyItem(s, Number(select.dataset.dummySlot), name));
  } else if (select.dataset.dummyBoots !== undefined) {
    update((s) => actions.setCustomDummyBoots(s, name));
  }
});

// When a search starts, moves the progress bar or finishes, redraw only the results part.
// (Redrawing the whole page ~100 times during Optimize would wipe out a number half-typed in a box.)
searches.onSearchChange(renderResults);

// First draw, and the first quick search.
update((s) => s);
