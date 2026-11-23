// The checks that the faster searches give the right answer. In their own file so they run
// in parallel with search.test.ts. The slowest checks are in search.slow.test.ts.
import { test, expect } from "vitest";
import { beamSearch, everyBuildSearch } from "../../src/optimizer/search.ts";
import { enemyTypes, presetDummy, summary } from "./helpers.ts";

test("filter test: Early and Mid give the same top 5 with and without the filter", () => {
  for (const stage of ["early", "mid"] as const) {
    for (const enemyType of enemyTypes) {
      const input = { stage, target: presetDummy(enemyType, stage), boots: "tier2" as const };
      expect(summary(everyBuildSearch({ ...input, useFilter: false }))).toEqual(summary(everyBuildSearch(input)));
    }
  }
}, 60_000);

test("filter test: Late gives the same top 5 with and without the filter", () => {
  for (const enemyType of enemyTypes) {
    const input = { stage: "late" as const, target: presetDummy(enemyType, "late"), boots: "tier2" as const };
    expect(summary(beamSearch({ ...input, useFilter: false }, 300))).toEqual(summary(beamSearch(input, 300)));
  }
}, 60_000);

test("the beam finds the true top 5 on Mid (every build is quick to check there)", () => {
  for (const enemyType of enemyTypes) {
    const input = { stage: "mid" as const, target: presetDummy(enemyType, "mid"), boots: "tier2" as const };
    expect(summary(beamSearch(input, 300))).toEqual(summary(everyBuildSearch(input)));
  }
}, 60_000);
