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
// only boots tried, banned items are left out of the pool.
import { getItem, type Item } from "../data/items.ts";
import { simulateBuild } from "../simulation/simulate-build.ts";
import type { Target } from "../simulation/simulate.ts";
import { constraintProblem, noConstraints, type BuildConstraints } from "./constraints.ts";
import { canBeBuiltTogether } from "./legal.ts";
import { bootsPool, legendaryPool, type BootsSetting } from "./item-pool.ts";
import { checkSetup, type KatarinaSetup } from "./setup.ts";
import { keepTop, type FoundBuild } from "./top-builds.ts";

export const searchSettings = {
  topBuilds: 5,
  beamWidth: 300,
  // Up to this many FREE slots (not locked by the user), trying every build is fast enough.
  everyBuildMaxItems: 2,
};

export type SearchInput = KatarinaSetup & {
  target: Target;
  boots: BootsSetting;
  constraints?: BuildConstraints; // default: none
  useFilter?: boolean; // default true; false only in the filter test
  onProgress?: (fraction: number) => void; // 0 to 1, for a loading bar
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
  const legendaries = legendaryPool(input.useFilter ?? true).legendaries.filter((i) => !banned.has(i.name));
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
  function score(indices: number[], bootsItem: Item | undefined): FoundBuild {
    const sorted = [...indices].sort((a, b) => a - b);
    const items = sorted.map((i) => legendaries[i]);
    if (bootsItem) items.push(bootsItem);
    const events = simulateBuild(input.level, items, input.target, input.rank, input.ability).events;
    let damage = 0;
    for (const event of events) damage += event.amount;
    let gold = 0;
    for (const item of items) gold += item.gold;
    return { items, damage, gold };
  }

  // Boots off = one "no boots" choice, so the loops below work the same either way.
  // Locked boots = the only choice. Boots that clash with a locked item are dropped here.
  const allBoots = constraints.requiredBoots !== null ? [getItem(constraints.requiredBoots)] : bootsPool(input.boots).filter((i) => !banned.has(i.name));
  const fittingBoots = allBoots.filter((b) => locked.every((i) => bootsLegal(b, i)));
  const bootsChoices: (Item | undefined)[] = input.boots === "off" ? [undefined] : fittingBoots;
  return { legendaries, locked, bootsChoices, itemCount, legal, bootsLegal, score };
}

export function everyBuildSearch(input: SearchInput): FoundBuild[] {
  const { legendaries, locked, bootsChoices, itemCount, legal, bootsLegal, score } = prepare(input);
  const top: FoundBuild[] = [];
  const chosen: number[] = [...locked]; // every build starts with the locked items

  // Picks the free items in increasing pool order (so each combination comes up once),
  // skipping locked items and illegal pairs.
  function pick(from: number): void {
    if (chosen.length === itemCount) {
      for (const bootsItem of bootsChoices) {
        if (chosen.every((i) => bootsLegal(bootsItem, i))) keepTop(top, score(chosen, bootsItem), searchSettings.topBuilds);
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
  const { legendaries, locked, bootsChoices, itemCount, legal, bootsLegal, score } = prepare(input);

  // A partial build: some legendaries (pool indices) and its boots. Every one starts from the locked items.
  type Partial = { indices: number[]; boots: Item | undefined };
  let beam: Partial[] = bootsChoices.map((boots) => ({ indices: [...locked], boots }));
  const firstSize = locked.length + 1;
  const steps = itemCount - locked.length;

  for (let size = firstSize; size <= itemCount; size++) {
    const best: FoundBuild[] = [];
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

        const build = score(indices, partial.boots);
        partialOf.set(build, { indices, boots: partial.boots });
        keepTop(best, build, size === itemCount ? searchSettings.topBuilds : beamWidth);
      }
    });

    input.onProgress?.((size - firstSize + 1) / steps);
    if (size === itemCount) return best;
    beam = best.map((build) => partialOf.get(build)!);
  }

  // Every slot is locked: nothing to choose but the boots.
  const top: FoundBuild[] = [];
  for (const partial of beam) keepTop(top, score(partial.indices, partial.boots), searchSettings.topBuilds);
  input.onProgress?.(1);
  return top;
}
