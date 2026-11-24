// Everything the user has picked on the page, in one object ("the state"), plus the small
// functions that change it. Each function takes the old state and returns a NEW one; it never
// touches the page. main.ts calls them when a button is clicked and then redraws the page.
// Keeping them apart from the page means the tests can check them without a browser.
import { dummyPresets, type EnemyType } from "../data/dummy-presets.ts";
import { championLevels, ultimateRanks } from "../data/game-rules.ts";
import { getItem, type Item } from "../data/items.ts";
import { isModelled, playableChampions, type AbilityKey, type PlayableChampionId } from "../data/playable-champions.ts";
import { stages, type StageName } from "../data/stages.ts";
import type { BootsSetting } from "../optimizer/item-pool.ts";
import type { SearchRequest } from "../optimizer/messages.ts";
import { constraintProblem, type BuildConstraints } from "../optimizer/constraints.ts";
import { maxItemCount, type ChampionSetup } from "../optimizer/setup.ts";
import type { Target } from "../simulation/simulate.ts";
import type { MinStats, PanelStat } from "../stats/stat-panel.ts";
import { dummyStats, recommendedDummyItems, withTypedStats, type TypedStats } from "../stats/dummy-stats.ts";
import {
  maxRankAtLevel,
  noRanks,
  pointsSpent,
  ranksAreLegal,
  recommendedRanks,
  skillPointsAtLevel,
  type AbilityRanks,
} from "../stats/ability-ranks.ts";

export type PageState = {
  champion: PlayableChampionId;
  ability: AbilityKey; // the ability card that's selected
  stage: StageName; // the last stage preset clicked
  level: number; // the champion's level
  ranks: AbilityRanks; // 0 = not learned. Always legal for the level (see ability-ranks.ts).
  itemCount: number; // legendary slots; boots get their own slot on top
  bootsOn: boolean;
  midQuest: boolean; // tier-3 boots; only possible with boots on
  enemyType: EnemyType;
  dummyLevel: number;
  dummyLevelFollowsChampion: boolean; // true until the user edits the dummy's level
  useRecommendedItems: boolean;
  // The dummy's items when "Use recommended items" is off. `null` = empty slot.
  // "legendaries" also holds support items (a support dummy like Nami buys one).
  customDummyItems: { legendaries: (string | null)[]; boots: string | null };
  typedDummyStats: TypedStats; // numbers the user typed in; they override the calculated ones
  // The dummy's health when the ability is cast, in % of its maximum (Eric: starts at 100).
  // Every ability uses it (Eric): missing-health damage (Garen's R, Akali's R2) and item effects
  // that read the dummy's health (Shadowflame, Kraken Slayer, Blade of the Ruined King...).
  dummyHealthPercent: number;
  // The user's conditions on the build. locked[i] = the item locked into item slot i
  // (null = the optimizer chooses). Banned items are left out of every search.
  locked: (string | null)[];
  lockedBoots: string | null;
  banned: string[];
  // "Minimum stats": e.g. { abilityPower: 150 }. Only stats with a number typed in are listed.
  minStats: MinStats;
  // "Maximize": stats to rank builds by instead of damage, in the order they were switched on.
  maximize: PanelStat[];
};

const noTypedStats: TypedStats = { hp: null, armor: null, magicResist: null };

export function initialState(): PageState {
  const blank: PageState = {
    champion: "katarina",
    ability: "r",
    stage: "early",
    level: 1,
    ranks: noRanks,
    itemCount: 1,
    bootsOn: true,
    midQuest: false,
    enemyType: "squishy",
    dummyLevel: 1,
    dummyLevelFollowsChampion: true,
    useRecommendedItems: true,
    customDummyItems: { legendaries: [], boots: null },
    typedDummyStats: noTypedStats,
    dummyHealthPercent: 100,
    locked: [],
    lockedBoots: null,
    banned: [],
    minStats: {},
    maximize: [],
  };
  return applyStage(blank, "early");
}

// ---- Reading the state ----

export function bootsSetting(state: PageState): BootsSetting {
  if (!state.bootsOn) return "off";
  return state.midQuest ? "tier3" : "tier2";
}

// What the search needs from the champion's side, or null if the selected ability can't be calculated:
// it isn't modelled or deals no damage (W), or it has no points yet (R below level 6, or a rank set to 0).
export function championSetup(state: PageState): ChampionSetup | null {
  const ability = state.ability;
  if (!isModelled(state.champion, ability)) return null;
  const rank = state.ranks[ability];
  if (rank < 1) return null;
  return { champion: state.champion, level: state.level, ability, rank, itemCount: state.itemCount };
}

// Why the selected ability can't be calculated, in plain words (null = it can).
export function abilityProblem(state: PageState): string | null {
  const ability = playableChampions[state.champion].abilities.list.find((a) => a.key === state.ability);
  if (!ability || !isModelled(state.champion, ability.key)) return null; // W and "coming soon" have their own message
  if (state.ranks[ability.key] >= 1) return null;
  if (maxRankAtLevel(ability.key, state.level) === 0) {
    return `${ability.name} unlocks at level ${ultimateRanks.levels[0]}.`;
  }
  return `Put a point in ${ability.name} to calculate it.`;
}

// Skill points used out of the ones available ("9 / 11 skill points"), for the setup summary.
export function skillPointsText(state: PageState): string {
  return `${pointsSpent(state.ranks)} / ${skillPointsAtLevel(state.level)} skill points`;
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

// The dummy the search uses: calculated stats, with typed-in numbers on top, starting the cast at
// the "Health %" box's share of its maximum HP. (Left out at 100%: a full dummy, the default.)
export function dummyTarget(state: PageState): Target {
  const target = withTypedStats(calculatedDummy(state), state.typedDummyStats);
  if (state.dummyHealthPercent === 100) return target;
  return { ...target, startHpShare: state.dummyHealthPercent / 100 };
}

// The conditions to send to the search: only locks in slots that are switched on.
export function buildConstraints(state: PageState): BuildConstraints {
  return {
    required: state.locked.slice(0, state.itemCount).filter((name): name is string => name !== null),
    requiredBoots: state.bootsOn ? state.lockedBoots : null,
    banned: state.banned,
    minStats: state.minStats,
    maximize: state.maximize,
  };
}

// What's wrong with the user's locks and bans, in plain words, or null. Shown on the page.
export function conditionProblem(state: PageState): string | null {
  return constraintProblem(buildConstraints(state), bootsSetting(state), state.itemCount);
}

// What to send to the search worker, with `itemCount` legendary slots. null when the ability can't
// be calculated (championSetup), or when the locks and bans make no sense (the page shows conditionProblem instead).
export function searchRequest(state: PageState, itemCount: number): SearchRequest | null {
  const setup = championSetup(state);
  if (setup === null || conditionProblem(state) !== null) return null;
  return { ...setup, itemCount, target: dummyTarget(state), boots: bootsSetting(state), constraints: buildConstraints(state) };
}

// The quick search: the locked items plus ONE free item, and boots. Always fast, and it's the
// whole answer when every slot but one is locked.
// Minimum stats are for the FINISHED build, so a quick search that leaves slots empty ignores them
// (one item rarely reaches 150 AP and 150 AD). Optimize then follows them.
export function quickSearchRequest(state: PageState): SearchRequest | null {
  const quickCount = Math.min(state.itemCount, buildConstraints(state).required.length + 1);
  const request = searchRequest(state, quickCount);
  if (request === null || quickCount === state.itemCount) return request;
  return { ...request, constraints: { ...request.constraints!, minStats: {} } };
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

// A stage sets the level, the ranks in the champion's usual skill order (Katarina: R whenever possible,
// then Q, then E, then W), the item count and the dummy's level.
export function applyStage(state: PageState, stage: StageName): PageState {
  const { level, itemsWithBoots, itemsWithoutBoots } = stages[stage];
  return {
    ...state,
    stage,
    level,
    ranks: recommendedRanks(state.champion, level),
    itemCount: state.bootsOn ? itemsWithBoots : itemsWithoutBoots,
    dummyLevel: stages[stage].level,
    dummyLevelFollowsChampion: true,
    typedDummyStats: noTypedStats,
  };
}

// A new level also resets the ranks to the usual skill order at that level (the user can move
// points afterwards), so they're always legal: no rank 5 Q at level 6.
export function setLevel(state: PageState, level: number): PageState {
  const newLevel = clampLevel(level);
  const follows = state.dummyLevelFollowsChampion;
  return {
    ...state,
    level: newLevel,
    ranks: recommendedRanks(state.champion, newLevel),
    dummyLevel: follows ? newLevel : state.dummyLevel,
    typedDummyStats: follows ? noTypedStats : state.typedDummyStats,
  };
}

// Clicking rank box `rank` of an ability. Clicking the highest filled box takes that point back
// (so points can be moved to another ability); any other box sets the rank to it.
// A click that would break the level rules (rank too high for the level, or more points than
// the level gives) is ignored. The page also greys those boxes out (rankAllowed).
export function setRank(state: PageState, ability: AbilityKey, rank: number): PageState {
  if (!rankAllowed(state, ability, rank)) return state;
  return { ...state, ranks: { ...state.ranks, [ability]: rankAfterClick(state, ability, rank) } };
}

export function rankAllowed(state: PageState, ability: AbilityKey, rank: number): boolean {
  return ranksAreLegal(state.level, { ...state.ranks, [ability]: rankAfterClick(state, ability, rank) });
}

function rankAfterClick(state: PageState, ability: AbilityKey, rank: number): number {
  return rank === state.ranks[ability] ? rank - 1 : rank;
}

export function selectAbility(state: PageState, ability: AbilityKey): PageState {
  return { ...state, ability };
}

// Opening another champion's page keeps every setting, but the ranks follow the new champion's own
// skill order at the same level (one champion's ranks can be wrong for another's skill order).
export function selectChampion(state: PageState, champion: PlayableChampionId): PageState {
  if (champion === state.champion) return state;
  return { ...state, champion, ranks: recommendedRanks(champion, state.level) };
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

// Typing in a minimum stat box. `null` (an empty box) = no minimum for that stat.
export function setMinStat(state: PageState, stat: PanelStat, value: number | null): PageState {
  const minStats = { ...state.minStats };
  if (value === null) delete minStats[stat];
  else minStats[stat] = value;
  return { ...state, minStats };
}

// Clears the minimums and the Maximize switches (the "Clear" link under the stat boxes).
export function clearMinStats(state: PageState): PageState {
  return { ...state, minStats: {}, maximize: [] };
}

// A stat's Max button: switches maximizing that stat on or off. Several can be on at once.
export function toggleMaximize(state: PageState, stat: PanelStat): PageState {
  const on = state.maximize.includes(stat);
  return { ...state, maximize: on ? state.maximize.filter((s) => s !== stat) : [...state.maximize, stat] };
}

export function setEnemyType(state: PageState, enemyType: EnemyType): PageState {
  return { ...state, enemyType, typedDummyStats: noTypedStats };
}

export function setDummyLevel(state: PageState, level: number): PageState {
  return { ...state, dummyLevel: clampLevel(level), dummyLevelFollowsChampion: false, typedDummyStats: noTypedStats };
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

// Typing in the dummy's health box: a % of its maximum, kept between 1 and 100. An empty box (null)
// goes back to full health.
export function setDummyHealthPercent(state: PageState, percent: number | null): PageState {
  const value = percent === null || !Number.isFinite(percent) ? 100 : Math.min(Math.max(percent, 1), 100);
  return { ...state, dummyHealthPercent: value };
}

export function clearTypedStats(state: PageState): PageState {
  return { ...state, typedDummyStats: noTypedStats };
}
