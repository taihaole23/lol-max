// SLOW TESTS (a few minutes). They only run with `npm run test:slow`; `npm test` skips them.
// Run them before each release, and whenever item passives or the search change.
//
// npm sets `npm_lifecycle_event` to the name of the script being run, so this is how the
// file knows it was started by "test:slow" (works on Windows, Mac and Linux alike).
import { test, expect } from "vitest";
import { noConstraints } from "../../src/optimizer/constraints.ts";
import { beamSearch, everyBuildSearch } from "../../src/optimizer/search.ts";
import { abilityCases, enemyTypes, presetInput, summary } from "./helpers.ts";

const runSlow = import.meta.env.npm_lifecycle_event === "test:slow";
const minutes = 60_000;

for (const { champion, ability, name } of abilityCases) {
  for (const enemyType of enemyTypes) {
    test.runIf(runSlow)(`${name}, Late, ${enemyType}: the beam's top 5 = trying every build (~1.3 million)`, () => {
      const input = presetInput(enemyType, "late", "tier2", ability, champion);
      expect(summary(beamSearch(input, 300))).toEqual(summary(everyBuildSearch(input)));
    }, 10 * minutes);

    test.runIf(runSlow)(`${name}, Full, ${enemyType}: a beam of 300 gives the same top 5 as a beam of 5,000`, () => {
      const input = presetInput(enemyType, "full", "tier2", ability, champion);
      expect(summary(beamSearch(input, 300))).toEqual(summary(beamSearch(input, 5000)));
    }, 10 * minutes);
  }
}

// Minimum stats: the beam drops partial builds that can't reach a minimum any more (a best-case
// guess, see couldStillReach in search.ts). These check the guess never throws away a build the
// real top 5 needs.
const minimumCases = [
  { champion: "katarina", ability: "r", minStats: { abilityPower: 200, attackDamage: 200 }, name: "Katarina R, 200 AP + 200 AD" },
  { champion: "katarina", ability: "r", minStats: { armor: 150 }, name: "Katarina R, 150 armor" },
  { champion: "yone", ability: "q", minStats: { critChance: 1 }, name: "Yone Q, 100% crit" },
  { champion: "akali", ability: "r", minStats: { health: 2500, abilityHaste: 30 }, name: "Akali R, 2500 HP + 30 haste" },
] as const;

for (const { champion, ability, minStats, name } of minimumCases) {
  test.runIf(runSlow)(`${name}, Late, bruiser: the beam's top 5 = trying every build`, () => {
    const input = { ...presetInput("bruiser", "late", "tier2", ability, champion), constraints: { ...noConstraints, minStats } };
    const exact = everyBuildSearch(input);
    expect(exact.length).toBeGreaterThan(0); // a minimum no build reaches would check nothing
    expect(summary(beamSearch(input, 300))).toEqual(summary(exact));
  }, 10 * minutes);
  test.runIf(runSlow)(`${name}, Full, bruiser: a beam of 300 gives the same top 5 as a beam of 5,000`, () => {
    const input = { ...presetInput("bruiser", "full", "tier2", ability, champion), constraints: { ...noConstraints, minStats } };
    const wide = beamSearch(input, 5000);
    expect(wide.length).toBe(5);
    expect(summary(beamSearch(input, 300))).toEqual(summary(wide));
  }, 20 * minutes);
}

// Maximize: the beam ranks partial builds by the balanced score instead of damage. Same two checks.
const maximizeCases = [
  { champion: "katarina", ability: "r", maximize: ["abilityPower", "attackDamage"], name: "Katarina R, max AP + AD" },
  { champion: "yone", ability: "q", maximize: ["critChance"], name: "Yone Q, max crit" },
  { champion: "akali", ability: "r", maximize: ["abilityPower", "health"], name: "Akali R, max AP + HP" },
] as const;

for (const { champion, ability, maximize, name } of maximizeCases) {
  const constraints = { ...noConstraints, maximize: [...maximize] };
  test.runIf(runSlow)(`${name}, Late, bruiser: the beam's top 5 = trying every build`, () => {
    const input = { ...presetInput("bruiser", "late", "tier2", ability, champion), constraints };
    expect(summary(beamSearch(input, 300))).toEqual(summary(everyBuildSearch(input)));
  }, 10 * minutes);
  test.runIf(runSlow)(`${name}, Full, bruiser: a beam of 300 gives the same top 5 as a beam of 5,000`, () => {
    const input = { ...presetInput("bruiser", "full", "tier2", ability, champion), constraints };
    expect(summary(beamSearch(input, 300))).toEqual(summary(beamSearch(input, 5000)));
  }, 20 * minutes);
}
