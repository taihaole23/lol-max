// Locked (required) and banned items.
import { test, expect } from "vitest";
import { constraintProblem, noConstraints } from "../../src/optimizer/constraints.ts";
import { beamSearch, everyBuildSearch, findTopBuilds } from "../../src/optimizer/search.ts";
import { presetInput, summary } from "./helpers.ts";

const names = (build: { items: { name: string }[] }) => build.items.map((i) => i.name);
const withConstraints = (input: ReturnType<typeof presetInput>, c: Partial<typeof noConstraints>) => ({
  ...input,
  constraints: { ...noConstraints, ...c },
});

test("a locked item is in every one of the top 5", () => {
  const top = findTopBuilds(withConstraints(presetInput("tank", "late"), { required: ["Zhonya's Hourglass"] }));
  expect(top).toHaveLength(5);
  for (const build of top) expect(names(build)).toContain("Zhonya's Hourglass");
});

test("a banned item is in none of the top 5", () => {
  const free = findTopBuilds(presetInput("tank", "mid"));
  const favourite = names(free[0]).find((n) => !/Boots|Shoes|Greaves|Treads|Steelcaps|Swiftness/.test(n))!;
  const top = findTopBuilds(withConstraints(presetInput("tank", "mid"), { banned: [favourite] }));
  for (const build of top) expect(names(build)).not.toContain(favourite);
});

test("locked boots are the boots in every build; banned boots never appear", () => {
  const locked = findTopBuilds(withConstraints(presetInput("tank", "mid"), { requiredBoots: "Plated Steelcaps" }));
  for (const build of locked) expect(names(build)).toContain("Plated Steelcaps");
  const banned = findTopBuilds(withConstraints(presetInput("tank", "mid"), { banned: ["Sorcerer's Shoes", "Berserker's Greaves"] }));
  for (const build of banned) expect(names(build)).not.toContain("Sorcerer's Shoes");
});

test("every slot locked: only the boots are chosen", () => {
  const input = withConstraints(presetInput("tank", "mid"), { required: ["Zhonya's Hourglass", "Rabadon's Deathcap"] });
  const top = findTopBuilds(input);
  for (const build of top) expect(names(build).slice(0, 2).sort()).toEqual(["Rabadon's Deathcap", "Zhonya's Hourglass"]);
  expect(new Set(top.map((b) => names(b)[2])).size).toBe(top.length); // 5 different boots
});

test("an item the speed filter removes can still be locked in (Frozen Heart)", () => {
  const top = findTopBuilds(withConstraints(presetInput("tank", "early"), { required: ["Frozen Heart"] }));
  for (const build of top) expect(names(build)).toContain("Frozen Heart");
});

test("with 1 lock, the beam still finds the true top 5 (Late: 2 free slots... checked against every build)", () => {
  // Late has 3 items; with 1 locked, 2 are free, so findTopBuilds uses every build. Compare with the beam.
  const input = withConstraints(presetInput("bruiser", "late"), { required: ["Black Cleaver"] });
  expect(summary(beamSearch(input, 300))).toEqual(summary(everyBuildSearch(input)));
}, 60_000);

test("impossible conditions are explained, and the search refuses them", () => {
  const p = (c: Partial<typeof noConstraints>, boots: "tier2" | "off" = "tier2", count = 3) => constraintProblem({ ...noConstraints, ...c }, boots, count);
  expect(p({})).toBeNull();
  expect(p({ required: ["Void Staff", "Terminus"] })).toMatch(/can't be built together/);
  expect(p({ required: ["Void Staff"], banned: ["Void Staff"] })).toMatch(/both locked in and banned/);
  expect(p({ required: ["Void Staff", "Rabadon's Deathcap", "Zhonya's Hourglass", "Nashor's Tooth"] })).toMatch(/only 3 item slots/);
  expect(p({ requiredBoots: "Plated Steelcaps" }, "off")).toMatch(/boots are turned off/);
  expect(p({ required: ["Ionian Boots of Lucidity"] })).toMatch(/isn't a completed item/);
  expect(() => findTopBuilds(withConstraints(presetInput("tank", "late"), { required: ["Void Staff", "Terminus"] }))).toThrow(/can't be built together/);
});

test("no constraints = the same top 5 as before", () => {
  const input = presetInput("squishy", "mid");
  expect(summary(findTopBuilds(withConstraints(input, {})))).toEqual(summary(findTopBuilds(input)));
});
