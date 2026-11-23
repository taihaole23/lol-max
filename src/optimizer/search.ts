// The optimizer: finds the builds that make one Death Lotus deal the most damage.
//
// Two ways to search (see NOTES.md, "Decisions"):
// - every build: tries every legal combination. Used for Early and Mid.
// - beam search: builds one item at a time and only keeps the best `beamWidth` partial builds
//   at each size. Much faster, but not guaranteed to find the true best. Used for Late and Full,
//   where trying every build would take ~30 s and ~4.5 hours. Tests check it against the real answer.
import type { Item } from "../data/items.ts";
import { stages, type StageName } from "../data/stages.ts";
import { simulateBuild } from "../simulation/simulate-build.ts";
import type { Target } from "../simulation/simulate.ts";
import { canBeBuiltTogether } from "./legal.ts";
import { bootsPool, legendaryPool, type BootsSetting } from "./item-pool.ts";
import { keepTop, type FoundBuild } from "./top-builds.ts";

export const searchSettings = {
  topBuilds: 5,
  beamWidth: 300,
  // Stages where trying every build is fast enough.
  everyBuildStages: ["early", "mid"] as StageName[],
};

export type SearchInput = {
  stage: StageName;
  target: Target;
  boots: BootsSetting;
  useFilter?: boolean; // default true; false only in the filter test
  onProgress?: (fraction: number) => void; // 0 to 1, for a loading bar
};

// Picks the right search for the stage.
export function findTopBuilds(input: SearchInput): FoundBuild[] {
  if (searchSettings.everyBuildStages.includes(input.stage)) return everyBuildSearch(input);
  return beamSearch(input, searchSettings.beamWidth);
}

// Everything both searches share: the items, the legality table and how to score a build.
function prepare(input: SearchInput) {
  const legendaries = legendaryPool(input.useFilter ?? true).legendaries;
  const boots = bootsPool(input.boots);
  const stage = stages[input.stage];
  const itemCount = input.boots === "off" ? stage.itemsWithoutBoots : stage.itemsWithBoots;

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
    const events = simulateBuild(stage.level, items, input.target).events;
    let damage = 0;
    for (const event of events) damage += event.amount;
    let gold = 0;
    for (const item of items) gold += item.gold;
    return { items, damage, gold };
  }

  // Boots off = one "no boots" choice, so the loops below work the same either way.
  const bootsChoices: (Item | undefined)[] = boots.length > 0 ? boots : [undefined];
  return { legendaries, bootsChoices, itemCount, legal, bootsLegal, score };
}

export function everyBuildSearch(input: SearchInput): FoundBuild[] {
  const { legendaries, bootsChoices, itemCount, legal, bootsLegal, score } = prepare(input);
  const top: FoundBuild[] = [];
  const chosen: number[] = [];

  // Picks items in increasing pool order (so each combination comes up once), skipping illegal pairs.
  function pick(from: number): void {
    if (chosen.length === itemCount) {
      for (const bootsItem of bootsChoices) {
        if (chosen.every((i) => bootsLegal(bootsItem, i))) keepTop(top, score(chosen, bootsItem), searchSettings.topBuilds);
      }
      return;
    }
    for (let i = from; i < legendaries.length; i++) {
      if (!chosen.every((j) => legal[i][j])) continue;
      chosen.push(i);
      pick(i + 1);
      chosen.pop();
      if (chosen.length === 0) input.onProgress?.((i + 1) / legendaries.length);
    }
  }

  pick(0);
  return top;
}

export function beamSearch(input: SearchInput, beamWidth: number): FoundBuild[] {
  const { legendaries, bootsChoices, itemCount, legal, bootsLegal, score } = prepare(input);

  // A partial build: some legendaries (pool indices) and its boots.
  type Partial = { indices: number[]; boots: Item | undefined };
  let beam: Partial[] = bootsChoices.map((boots) => ({ indices: [], boots }));

  for (let size = 1; size <= itemCount; size++) {
    const best: FoundBuild[] = [];
    const partialOf = new Map<FoundBuild, Partial>();
    const seen = new Set<string>(); // the same build can be reached by adding items in any order

    for (const partial of beam) {
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
    }

    input.onProgress?.(size / itemCount);
    if (size === itemCount) return best;
    beam = best.map((build) => partialOf.get(build)!);
  }
  return []; // only reached when the stage has 0 items
}
