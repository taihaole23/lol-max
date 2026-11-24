// The checks that the faster searches give the right answer. In their own file so they run
// in parallel with search.test.ts. The slowest checks are in search.slow.test.ts.
import { test, expect } from "vitest";
import { beamSearch, everyBuildSearch } from "../../src/optimizer/search.ts";
import { abilities, enemyTypes, presetInput, summary } from "./helpers.ts";

test("filter test: Early and Mid give the same top 5 with and without the filter (Q, E and R)", () => {
  for (const ability of abilities) {
    for (const stage of ["early", "mid"] as const) {
      for (const enemyType of enemyTypes) {
        const input = presetInput(enemyType, stage, "tier2", ability);
        expect(summary(everyBuildSearch({ ...input, useFilter: false }))).toEqual(summary(everyBuildSearch(input)));
      }
    }
  }
}, 120_000);

test("filter test: Late gives the same top 5 with and without the filter", () => {
  for (const enemyType of enemyTypes) {
    const input = presetInput(enemyType, "late");
    expect(summary(beamSearch({ ...input, useFilter: false }, 300))).toEqual(summary(beamSearch(input, 300)));
  }
}, 60_000);

test("the beam finds the true top 5 on Mid (every build is quick to check there; Q, E and R)", () => {
  for (const ability of abilities) {
    for (const enemyType of enemyTypes) {
      const input = presetInput(enemyType, "mid", "tier2", ability);
      expect(summary(beamSearch(input, 300))).toEqual(summary(everyBuildSearch(input)));
    }
  }
}, 120_000);
