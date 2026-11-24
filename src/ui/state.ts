// Everything the user has picked on the page, in one object ("the state"), plus the small
// functions that change it. Each function takes the old state and returns a NEW one; it never
// touches the page. main.ts calls them when a button is clicked and then redraws the page.
// Keeping them apart from the page means the tests can check them without a browser.
import { dummyPresets, type EnemyType } from "../data/dummy-presets.ts";
import { championLevels } from "../data/game-rules.ts";
import { getItem, type Item } from "../data/items.ts";
import type { AbilityKey, PlayableChampionId } from "../data/playable-champions.ts";
import { stages, type StageName } from "../data/stages.ts";
import type { BootsSetting } from "../optimizer/item-pool.ts";
import type { SearchRequest } from "../optimizer/messages.ts";
import { constraintProblem, type BuildConstraints } from "../optimizer/constraints.ts";
import { maxItemCount, stagePreset, type KatarinaSetup } from "../optimizer/setup.ts";
import type { Target } from "../simulation/simulate.ts";
import { dummyStats, recommendedDummyItems, withTypedStats, type TypedStats } from "../stats/dummy-stats.ts";
import { allowedRRanks } from "../stats/katarina-stats.ts";

export type PageState = {
  champion: PlayableChampionId;
  ability: AbilityKey; // the ability card that's selected
  stage: StageName; // the last stage preset clicked
  level: number; // Katarina's level
  ranks: Record<AbilityKey, number>; // 0 = not learned. Only R's rank is used (and checked) in version 1.
  itemCount: number; // legendary slots; boots get their own slot on top
  bootsOn: boolean;
  midQuest: boolean; // tier-3 boots; only possible with boots on
  enemyType: EnemyType;
  dummyLevel: number;
  dummyLevelFollowsKatarina: boolean; // true until the user edits the dummy's level
  useRecommendedItems: boolean;
  // The dummy's items when "Use recommended items" is off. `null` = empty slot.
  // "legendaries" also holds support items (a support dummy like Nami buys one).
  customDummyItems: { legendaries: (string | null)[]; boots: string | null };
  typedDummyStats: TypedStats; // numbers the user typed in; they override the calculated ones
  // The user's conditions on Katarina's build. locked[i] = the item locked into item slot i
  // (null = the optimizer chooses). Banned items are left out of every search.
  locked: (string | null)[];
  lockedBoots: string | null;
  banned: string[];
};

const noTypedStats: TypedStats = { hp: null, armor: null, magicResist: null };

export function initialState(): PageState {
  const blank: PageState = {
    champion: "katarina",
    ability: "r",
    stage: "early",
    level: 1,
    ranks: { q: 0, w: 0, e: 0, r: 0 },
    itemCount: 1,
    bootsOn: true,
    midQuest: false,
    enemyType: "squishy",
    dummyLevel: 1,
    dummyLevelFollowsKatarina: true,
    useRecommendedItems: true,
    customDummyItems: { legendaries: [], boots: null },
    typedDummyStats: noTypedStats,
    locked: [],
    lockedBoots: null,
    banned: [],
  };
  return applyStage(blank, "early");
}

// ---- Reading the state ----

export function bootsSetting(state: PageState): BootsSetting {
  if (!state.bootsOn) return "off";
  return state.midQuest ? "tier3" : "tier2";
}

// What the search needs from Katarina's side, or null if R can't be cast (below level 6).
export function katarinaSetup(state: PageState): KatarinaSetup | null {
  const rank = state.ranks.r;
  if (rank !== 1 && rank !== 2 && rank !== 3) return null;
  return { level: state.level, rRank: rank, itemCount: state.itemCount };
}

// How many legendary items the dummy's custom picker shows: the same as its recommended list.
export function dummyItemSlots(state: PageState): number {
  return stages[state.stage].itemsWithBoots;
}

export function dummyItems(state: PageState): Item[] {
  if (state.useRecommendedItems) return recommendedDummyItems(state.enemyType, state.stage);
  const { legendaries, boots } = state.customDummyItems;
  // Only the slots the picker shows (a stage with fewer slots hides the extra picks).
  const shown = legendaries.slice(0, dummyItemSlots(state));
  const names = [...shown, boots].filter((name): name is string => name !== null);
  return names.map(getItem);
}

// The dummy's stats before any typed-in numbers: champion at its level + its items.
export function calculatedDummy(state: PageState): Target {
  return dummyStats(dummyPresets[state.enemyType].champion, state.dummyLevel, dummyItems(state));
}

// The dummy the search uses: calculated stats, with typed-in numbers on top.
export function dummyTarget(state: PageState): Target {
  return withTypedStats(calculatedDummy(state), state.typedDummyStats);
}

// The conditions to send to the search: only locks in slots that are switched on.
export function buildConstraints(state: PageState): BuildConstraints {
  return {
    required: state.locked.slice(0, state.itemCount).filter((name): name is string => name !== null),
    requiredBoots: state.bootsOn ? state.lockedBoots : null,
    banned: state.banned,
  };
}

// What's wrong with the user's locks and bans, in plain words, or null. Shown on the page.
export function conditionProblem(state: PageState): string | null {
  return constraintProblem(buildConstraints(state), bootsSetting(state), state.itemCount);
}

// What to send to the search worker, with `itemCount` legendary slots. null when R can't be cast
// yet, or when the locks and bans make no sense (the page shows conditionProblem instead).
export function searchRequest(state: PageState, itemCount: number): SearchRequest | null {
  const setup = katarinaSetup(state);
  if (setup === null || conditionProblem(state) !== null) return null;
  return { ...setup, itemCount, target: dummyTarget(state), boots: bootsSetting(state), constraints: buildConstraints(state) };
}

// The quick search: the locked items plus ONE free item, and boots. Always fast, and it's the
// whole answer when every slot but one is locked.
export function quickSearchRequest(state: PageState): SearchRequest | null {
  const quickCount = Math.min(state.itemCount, buildConstraints(state).required.length + 1);
  return searchRequest(state, quickCount);
}

export function fullSearchRequest(state: PageState): SearchRequest | null {
  return searchRequest(state, state.itemCount);
}

// Where each item of a build goes in the slots: locked items in the slot they were locked into,
// the build's other items filling the free slots in order. A slot is null while no result fills it.
// Locked items show straight away, even before any search has finished.
export type SlotContent = { item: Item; locked: boolean } | null;

export function arrangeSlots(state: PageState, buildItems: Item[] | undefined): { boots: SlotContent; items: SlotContent[] } {
  const isBoots = (item: Item) => item.category === "boots" || item.category === "boots-tier-3";
  const lockedNames = new Set(buildConstraints(state).required);
  const free = (buildItems ?? []).filter((item) => !isBoots(item) && !lockedNames.has(item.name));

  const items: SlotContent[] = [];
  for (let slot = 0; slot < state.itemCount; slot++) {
    const lockedName = state.locked[slot] ?? null;
    if (lockedName !== null) items.push({ item: getItem(lockedName), locked: true });
    else items.push(free.length > 0 ? { item: free.shift()!, locked: false } : null);
  }

  let boots: SlotContent = null;
  if (state.bootsOn && state.lockedBoots !== null) boots = { item: getItem(state.lockedBoots), locked: true };
  else if (state.bootsOn) {
    const found = (buildItems ?? []).find(isBoots);
    boots = found ? { item: found, locked: false } : null;
  }
  return { boots, items };
}

// ---- Changing the state ----
// Anything that changes the calculated dummy also clears the typed-in numbers, so an old
// typed number never sits silently on top of a new dummy.

function clampLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  return Math.min(Math.max(Math.round(level), 1), championLevels.max);
}

// The highest R rank the level allows, or 0 below level 6.
function highestRRank(level: number): number {
  return allowedRRanks(level).at(-1) ?? 0;
}

export function applyStage(state: PageState, stage: StageName): PageState {
  const preset = stagePreset(stage, bootsSetting(state));
  return {
    ...state,
    stage,
    level: preset.level,
    ranks: { ...state.ranks, r: preset.rRank },
    itemCount: preset.itemCount,
    dummyLevel: stages[stage].level,
    dummyLevelFollowsKatarina: true,
    typedDummyStats: noTypedStats,
  };
}

// A new level also sets R to the highest rank it allows (the user can lower it afterwards).
export function setLevel(state: PageState, level: number): PageState {
  const newLevel = clampLevel(level);
  const follows = state.dummyLevelFollowsKatarina;
  return {
    ...state,
    level: newLevel,
    ranks: { ...state.ranks, r: highestRRank(newLevel) },
    dummyLevel: follows ? newLevel : state.dummyLevel,
    typedDummyStats: follows ? noTypedStats : state.typedDummyStats,
  };
}

// Clicking a rank box. R only accepts ranks the level allows; basic abilities accept any rank
// (their level rules are ignored for now, and nothing uses their rank yet).
export function setRank(state: PageState, ability: AbilityKey, rank: number): PageState {
  if (ability === "r" && !allowedRRanks(state.level).some((allowed) => allowed === rank)) return state;
  return { ...state, ranks: { ...state.ranks, [ability]: rank } };
}

export function selectAbility(state: PageState, ability: AbilityKey): PageState {
  return { ...state, ability };
}

// Locks only make sense in slots that exist: removing a slot removes its lock.
const trimLocks = (state: PageState): PageState => ({ ...state, locked: state.locked.slice(0, state.itemCount) });

// The +/- slot buttons: 1 to 6 legendaries with boots off, 1 to 5 with boots on.
export function changeItemCount(state: PageState, change: number): PageState {
  const max = maxItemCount(bootsSetting(state));
  return trimLocks({ ...state, itemCount: Math.min(Math.max(state.itemCount + change, 1), max) });
}

// Turning boots on takes a slot, so 6 legendaries drop to 5. Turning boots off also turns off
// the mid quest, which needs boots, and drops locked boots.
export function setBootsOn(state: PageState, bootsOn: boolean): PageState {
  const next = { ...state, bootsOn, midQuest: bootsOn ? state.midQuest : false, lockedBoots: bootsOn ? state.lockedBoots : null };
  return trimLocks({ ...next, itemCount: Math.min(next.itemCount, maxItemCount(bootsSetting(next))) });
}

// The mid quest swaps tier-2 boots for tier-3, so locked boots no longer fit: they're dropped.
export function setMidQuest(state: PageState, midQuest: boolean): PageState {
  if (!state.bootsOn) return state;
  return { ...state, midQuest, lockedBoots: midQuest === state.midQuest ? state.lockedBoots : null };
}

// ---- Locks and bans (clicking a slot, the item picker) ----

// Locks `name` into item slot `slot`. An item can only be in one slot, and locking it un-bans it.
export function lockItem(state: PageState, slot: number, name: string): PageState {
  const locked = state.locked.map((n) => (n === name ? null : n));
  while (locked.length <= slot) locked.push(null);
  locked[slot] = name;
  return { ...state, locked, banned: state.banned.filter((n) => n !== name) };
}

export function unlockSlot(state: PageState, slot: number): PageState {
  return { ...state, locked: state.locked.map((n, i) => (i === slot ? null : n)) };
}

export function lockBoots(state: PageState, name: string): PageState {
  return { ...state, lockedBoots: name, banned: state.banned.filter((n) => n !== name) };
}

export function unlockBoots(state: PageState): PageState {
  return { ...state, lockedBoots: null };
}

// Bans an item ("never use this"). If it was locked somewhere, that lock goes.
export function banItem(state: PageState, name: string): PageState {
  if (state.banned.includes(name)) return state;
  return {
    ...state,
    banned: [...state.banned, name],
    locked: state.locked.map((n) => (n === name ? null : n)),
    lockedBoots: state.lockedBoots === name ? null : state.lockedBoots,
  };
}

export function unbanItem(state: PageState, name: string): PageState {
  return { ...state, banned: state.banned.filter((n) => n !== name) };
}

export function clearConditions(state: PageState): PageState {
  return { ...state, locked: [], lockedBoots: null, banned: [] };
}

export function setEnemyType(state: PageState, enemyType: EnemyType): PageState {
  return { ...state, enemyType, typedDummyStats: noTypedStats };
}

export function setDummyLevel(state: PageState, level: number): PageState {
  return { ...state, dummyLevel: clampLevel(level), dummyLevelFollowsKatarina: false, typedDummyStats: noTypedStats };
}

// Unticking "Use recommended items" starts the custom picker from the recommended list,
// so the user only has to change the items they care about.
export function setUseRecommendedItems(state: PageState, useRecommendedItems: boolean): PageState {
  let customDummyItems = state.customDummyItems;
  if (!useRecommendedItems) {
    const recommended = recommendedDummyItems(state.enemyType, state.stage);
    // Every non-boots item, including support items like Nami's Dream Maker.
    const legendaries: (string | null)[] = recommended.filter((i) => i.category !== "boots").map((i) => i.name);
    while (legendaries.length < dummyItemSlots(state)) legendaries.push(null);
    const boots = recommended.find((i) => i.category === "boots")?.name ?? null;
    customDummyItems = { legendaries, boots };
  }
  return { ...state, useRecommendedItems, customDummyItems, typedDummyStats: noTypedStats };
}

export function setCustomDummyItem(state: PageState, slot: number, name: string | null): PageState {
  const legendaries = [...state.customDummyItems.legendaries];
  while (legendaries.length < dummyItemSlots(state)) legendaries.push(null);
  legendaries[slot] = name;
  return { ...state, customDummyItems: { ...state.customDummyItems, legendaries }, typedDummyStats: noTypedStats };
}

export function setCustomDummyBoots(state: PageState, boots: string | null): PageState {
  return { ...state, customDummyItems: { ...state.customDummyItems, boots }, typedDummyStats: noTypedStats };
}

// Choosing (or removing, with null) the item in one of the dummy's slots: "boots" or 0, 1, 2...
// With "Use recommended items" on, it first switches to custom items, starting from the
// recommended list, so only the clicked slot changes.
export function setDummySlot(state: PageState, slot: "boots" | number, name: string | null): PageState {
  const custom = state.useRecommendedItems ? setUseRecommendedItems(state, false) : state;
  return slot === "boots" ? setCustomDummyBoots(custom, name) : setCustomDummyItem(custom, slot, name);
}

// The dummy's slots for drawing: boots, then one entry per item slot (null = empty).
export function dummySlots(state: PageState): { boots: string | null; items: (string | null)[] } {
  const custom = state.useRecommendedItems ? setUseRecommendedItems(state, false).customDummyItems : state.customDummyItems;
  const items = custom.legendaries.slice(0, dummyItemSlots(state));
  while (items.length < dummyItemSlots(state)) items.push(null);
  return { boots: custom.boots, items };
}

// Typing a number into the dummy's HP / armor / MR box. `null` (an empty box) goes back to the calculated number.
export function setTypedStat(state: PageState, stat: keyof TypedStats, value: number | null): PageState {
  return { ...state, typedDummyStats: { ...state.typedDummyStats, [stat]: value } };
}

export function clearTypedStats(state: PageState): PageState {
  return { ...state, typedDummyStats: noTypedStats };
}
