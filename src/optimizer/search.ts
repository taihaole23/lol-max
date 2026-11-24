// The optimizer: finds the builds that make one cast of an ability (Q, E or R) deal the most damage.
//
// Two ways to search (see NOTES.md, "Decisions"):
// - every build: tries every legal combination. Used when at most 2 slots are free to choose.
// - beam search: builds one item at a time and only keeps the best `beamWidth` partial builds
//   at each size. Much faster, but not guaranteed to find the true best. Used for 3+ free slots,
//   where trying every build would take ~30 s (3 items) to ~4.5 hours (5 + boots).
//   Tests check it against the real answer.
//
// The user's conditions (constraints.ts): locked items start every build, locked boots are the
// only boots tried, banned items are left out of the pool, and a build that misses a minimum stat
// ("at least 150 AP") is skipped. The beam also drops partial builds that can't reach a minimum
// any more (couldStillReach below), so it doesn't fill up with builds that are bound to fail.
import { getItem, type Item } from "../data/items.ts";
import { simulateBuild } from "../simulation/simulate-build.ts";
import { itemStatsFor, meetsMinimums, panelStats, statsWithMinimum, type PanelStat, type PanelStats } from "../stats/stat-panel.ts";
import type { Target } from "../simulation/simulate.ts";
import { constraintProblem, noConstraints, type BuildConstraints } from "./constraints.ts";
import { canBeBuiltTogether } from "./legal.ts";
import { bootsPool, legendaryPool, type BootsSetting } from "./item-pool.ts";
import { checkSetup, type ChampionSetup } from "./setup.ts";
import { keepTop, ranksAbove, type FoundBuild } from "./top-builds.ts";

export const searchSettings = {
  topBuilds: 5,
  beamWidth: 300,
  // Up to this many FREE slots (not locked by the user), trying every build is fast enough.
  everyBuildMaxItems: 2,
};

export type SearchInput = ChampionSetup & {
  target: Target;
  boots: BootsSetting;
  constraints?: BuildConstraints; // default: none
  useFilter?: boolean; // default true; false only in the filter test
  onProgress?: (fraction: number) => void; // 0 to 1, for a loading bar
  // Only used by this file (and tests): rank builds by this ONE stat and skip the damage simulation.
  // That's how "Maximize" finds the most a stat can reach (its peak).
  peakOf?: PanelStat;
};

// Picks the right search for the number of FREE slots.
export function findTopBuilds(input: SearchInput): FoundBuild[] {
  const locked = input.constraints?.required.length ?? 0;
  if (input.itemCount - locked <= searchSettings.everyBuildMaxItems) return everyBuildSearch(input);
  return beamSearch(input, searchSettings.beamWidth);
}

// Everything both searches share: the items, the legality table and how to score a build.
function prepare(input: SearchInput) {
  checkSetup(input, input.boots);
  const constraints = input.constraints ?? noConstraints;
  const problem = constraintProblem(constraints, input.boots, input.itemCount);
  if (problem) throw new Error(problem);
  const banned = new Set(constraints.banned);

  // The pool: legendaries minus banned ones. A locked item the speed filter left out (Frozen Heart)
  // is added back at the end, so the user can still lock it in.
  const minStats = constraints.minStats ?? {};
  const legendaries = legendaryPool(input.useFilter ?? true, itemStatsFor(minStats)).legendaries.filter((i) => !banned.has(i.name));
  for (const name of constraints.required) {
    if (!legendaries.some((i) => i.name === name)) legendaries.push(getItem(name));
  }
  const locked = constraints.required.map((name) => legendaries.findIndex((i) => i.name === name));
  const itemCount = input.itemCount;

  // legal[i][j]: can legendaries i and j be in one build? Worked out once, not millions of times.
  const legal = legendaries.map((a) => legendaries.map((b) => canBeBuiltTogether(a.name, b.name)));
  const bootsLegal = (bootsItem: Item | undefined, i: number) =>
    !bootsItem || canBeBuiltTogether(bootsItem.name, legendaries[i].name);

  // Builds are always listed in the same order (legendaries by pool order, then boots), so the
  // same build always gets exactly the same damage, whichever search found it.
  function itemsOf(indices: number[], bootsItem: Item | undefined): Item[] {
    const sorted = [...indices].sort((a, b) => a - b);
    const items = sorted.map((i) => legendaries[i]);
    if (bootsItem) items.push(bootsItem);
    return items;
  }

  function score(indices: number[], bootsItem: Item | undefined): FoundBuild {
    const items = itemsOf(indices, bootsItem);
    let gold = 0;
    for (const item of items) gold += item.gold;
    // Looking for a stat's peak: only the stat matters, so the (slow) simulation is skipped.
    if (input.peakOf) return { items, damage: 0, gold, score: statsOf(items)[input.peakOf] };

    const events = simulateBuild(input.champion, input.level, items, input.target, input.rank, input.ability).events;
    let damage = 0;
    for (const event of events) damage += event.amount;
    if (peaks.size > 0) return { items, damage, gold, score: balancedScore(statsOf(items)) };
    return { items, damage, gold };
  }

  // ---- Minimum stats ----
  const statsOf = (items: Item[]) => panelStats(input.champion, input.level, items, input.ability);
  const limited = statsWithMinimum(minStats);

  // Does a finished build reach every minimum? (Always true with no minimums.)
  const fits = (indices: number[], bootsItem: Item | undefined) =>
    limited.length === 0 || meetsMinimums(statsOf(itemsOf(indices, bootsItem)), minStats);

  // For each stat with a minimum: the legendaries, the ones that raise it the most first
  // (measured on their own: the champion with just that item vs. with no items).
  const noItems = statsOf([]);
  const bestFor = new Map(
    limited.map((stat) => {
      const gain = legendaries.map((item) => statsOf([item])[stat] - noItems[stat]);
      return [stat, legendaries.map((_, i) => i).sort((a, b) => gain[b] - gain[a])];
    }),
  );

  // Could a partial build still reach every minimum, with `slotsLeft` more items? A best-case
  // guess: for each stat on its own, fill the free slots with the items that raise it the most,
  // ignoring item groups. It only throws away builds that clearly can't make it. Items that boost
  // each other (Rabadon's on top of AP items) can make the guess a little low, so a slow test
  // checks the beam still finds the same builds as trying every build.
  function couldStillReach(indices: number[], bootsItem: Item | undefined, slotsLeft: number): boolean {
    if (limited.length === 0) return true; // no minimums: nothing to check
    if (slotsLeft === 0) return fits(indices, bootsItem);
    for (const stat of limited) {
      const extra = bestFor.get(stat)!.filter((i) => !indices.includes(i)).slice(0, slotsLeft);
      const best = statsOf(itemsOf([...indices, ...extra], bootsItem));
      if (!meetsMinimums(best, { [stat]: minStats[stat] })) return false;
    }
    return true;
  }

  // ---- Maximize (Eric: "balanced") ----
  // Each maximized stat is measured as a share of its PEAK, the most any build can reach with the
  // same locks, bans and minimums (found by a quick stats-only search). A build's score is its
  // WEAKEST share: 75% of the peak AP and 70% of the peak AD scores 0.70, which beats 100% AP and
  // 20% AD (0.20). Damage breaks ties, so "maximize crit" on Yone ranks every 100%-crit build by damage.
  const maximize = input.peakOf ? [] : (constraints.maximize ?? []);
  const peaks = new Map<PanelStat, number>();
  for (const stat of maximize) {
    const best = findTopBuilds({ ...input, constraints: { ...constraints, maximize: [] }, peakOf: stat, onProgress: undefined })[0];
    peaks.set(stat, best?.score ?? 0);
  }
  function balancedScore(stats: PanelStats): number {
    let weakest = Infinity;
    for (const [stat, peak] of peaks) weakest = Math.min(weakest, peak > 0 ? stats[stat] / peak : 1);
    // Rounded, so two builds both at 100% crit really tie (and damage decides) instead of
    // differing in the 15th digit.
    return Math.round(weakest * 1e9) / 1e9;
  }

  // Boots off = one "no boots" choice, so the loops below work the same either way.
  // Locked boots = the only choice. Boots that clash with a locked item are dropped here.
  const allBoots = constraints.requiredBoots !== null ? [getItem(constraints.requiredBoots)] : bootsPool(input.boots).filter((i) => !banned.has(i.name));
  const fittingBoots = allBoots.filter((b) => locked.every((i) => bootsLegal(b, i)));
  const bootsChoices: (Item | undefined)[] = input.boots === "off" ? [undefined] : fittingBoots;
  // How close a partial build is to the minimums: each stat counts up to 1 when reached, so
  // 2 minimums give 0 to 2. 150 AP of 200 = 0.75. (Used by the beam, see below.)
  function progress(indices: number[], bootsItem: Item | undefined): number {
    const stats = statsOf(itemsOf(indices, bootsItem));
    let total = 0;
    for (const stat of limited) total += minStats[stat]! > 0 ? Math.min(stats[stat] / minStats[stat]!, 1) : 1;
    return total;
  }

  return { legendaries, locked, bootsChoices, itemCount, legal, bootsLegal, score, fits, couldStillReach, hasMinimums: limited.length > 0, progress };
}

export function everyBuildSearch(input: SearchInput): FoundBuild[] {
  const { legendaries, locked, bootsChoices, itemCount, legal, bootsLegal, score, fits } = prepare(input);
  const top: FoundBuild[] = [];
  const chosen: number[] = [...locked]; // every build starts with the locked items

  // Picks the free items in increasing pool order (so each combination comes up once),
  // skipping locked items and illegal pairs.
  function pick(from: number): void {
    if (chosen.length === itemCount) {
      for (const bootsItem of bootsChoices) {
        if (!chosen.every((i) => bootsLegal(bootsItem, i))) continue;
        if (fits(chosen, bootsItem)) keepTop(top, score(chosen, bootsItem), searchSettings.topBuilds);
      }
      return;
    }
    for (let i = from; i < legendaries.length; i++) {
      if (chosen.includes(i) || !chosen.every((j) => legal[i][j])) continue;
      chosen.push(i);
      pick(i + 1);
      chosen.pop();
      if (chosen.length === locked.length) input.onProgress?.((i + 1) / legendaries.length);
    }
  }

  pick(0);
  input.onProgress?.(1);
  return top;
}

export function beamSearch(input: SearchInput, beamWidth: number): FoundBuild[] {
  const { legendaries, locked, bootsChoices, itemCount, legal, bootsLegal, score, fits, couldStillReach, hasMinimums, progress } =
    prepare(input);

  // With minimums, the beam keeps TWO groups of partial builds: the `beamWidth` most damaging, and
  // the `beamWidth` closest to the minimums (most damaging first on a tie). Ranked by damage alone,
  // the beam filled up with high-damage partial builds that never reach the minimums, and the ones
  // that could were thrown away (Katarina, 200 AP + 200 AD: bug in NOTES.md).
  type Closest = { build: FoundBuild; progress: number };
  const closerThan = (a: Closest, b: Closest) => (a.progress !== b.progress ? a.progress > b.progress : ranksAbove(a.build, b.build));
  function keepClosest(list: Closest[], entry: Closest): void {
    if (list.length === beamWidth && !closerThan(entry, list[beamWidth - 1])) return;
    let place = list.length;
    while (place > 0 && closerThan(entry, list[place - 1])) place--;
    list.splice(place, 0, entry);
    if (list.length > beamWidth) list.pop();
  }

  // A partial build: some legendaries (pool indices) and its boots. Every one starts from the locked items.
  type Partial = { indices: number[]; boots: Item | undefined };
  let beam: Partial[] = bootsChoices.map((boots) => ({ indices: [...locked], boots }));
  const firstSize = locked.length + 1;
  const steps = itemCount - locked.length;

  for (let size = firstSize; size <= itemCount; size++) {
    const best: FoundBuild[] = [];
    const closest: Closest[] = [];
    const partialOf = new Map<FoundBuild, Partial>();
    const seen = new Set<string>(); // the same build can be reached by adding items in any order

    beam.forEach((partial, done) => {
      // Progress: whole slots finished so far, plus how far through this slot's beam we are.
      input.onProgress?.((size - firstSize + done / beam.length) / steps);
      for (let i = 0; i < legendaries.length; i++) {
        if (partial.indices.includes(i)) continue;
        if (!partial.indices.every((j) => legal[i][j]) || !bootsLegal(partial.boots, i)) continue;
        const indices = [...partial.indices, i].sort((a, b) => a - b);
        const key = indices.join(",") + "|" + (partial.boots?.name ?? "");
        if (seen.has(key)) continue;
        seen.add(key);
        if (!couldStillReach(indices, partial.boots, itemCount - size)) continue; // at the last size: reaches them now

        const build = score(indices, partial.boots);
        partialOf.set(build, { indices, boots: partial.boots });
        keepTop(best, build, size === itemCount ? searchSettings.topBuilds : beamWidth);
        if (hasMinimums && size < itemCount) keepClosest(closest, { build, progress: progress(indices, partial.boots) });
      }
    });

    input.onProgress?.((size - firstSize + 1) / steps);
    if (size === itemCount) return best;
    // The next beam: both groups, each partial build once (it can be in both).
    const next = new Set([...best, ...closest.map((c) => c.build)]);
    beam = [...next].map((build) => partialOf.get(build)!);
  }

  // Every slot is locked: nothing to choose but the boots.
  const top: FoundBuild[] = [];
  for (const partial of beam) {
    if (fits(partial.indices, partial.boots)) keepTop(top, score(partial.indices, partial.boots), searchSettings.topBuilds);
  }
  input.onProgress?.(1);
  return top;
}
