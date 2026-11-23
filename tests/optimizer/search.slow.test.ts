// SLOW TESTS (a few minutes). They only run with `npm run test:slow`; `npm test` skips them.
// Run them before each release, and whenever item passives or the search change.
//
// npm sets `npm_lifecycle_event` to the name of the script being run, so this is how the
// file knows it was started by "test:slow" (works on Windows, Mac and Linux alike).
import { test, expect } from "vitest";
import { beamSearch, everyBuildSearch } from "../../src/optimizer/search.ts";
import { enemyTypes, presetDummy, summary } from "./helpers.ts";

const runSlow = import.meta.env.npm_lifecycle_event === "test:slow";
const minutes = 60_000;

for (const enemyType of enemyTypes) {
  test.runIf(runSlow)(`Late, ${enemyType}: the beam's top 5 = trying every build (~1.3 million)`, () => {
    const input = { stage: "late" as const, target: presetDummy(enemyType, "late"), boots: "tier2" as const };
    expect(summary(beamSearch(input, 300))).toEqual(summary(everyBuildSearch(input)));
  }, 10 * minutes);

  test.runIf(runSlow)(`Full, ${enemyType}: a beam of 300 gives the same top 5 as a beam of 5,000`, () => {
    const input = { stage: "full" as const, target: presetDummy(enemyType, "full"), boots: "tier2" as const };
    expect(summary(beamSearch(input, 300))).toEqual(summary(beamSearch(input, 5000)));
  }, 10 * minutes);
}
