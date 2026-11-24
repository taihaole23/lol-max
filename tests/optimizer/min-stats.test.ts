// The "minimum stats" condition: the search only returns builds that reach every minimum.
import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { constraintProblem, noConstraints } from "../../src/optimizer/constraints.ts";
import { legendaryPool } from "../../src/optimizer/item-pool.ts";
import { beamSearch, everyBuildSearch, findTopBuilds } from "../../src/optimizer/search.ts";
import { meetsMinimums, panelStats, type MinStats } from "../../src/stats/stat-panel.ts";
import { presetInput, summary } from "./helpers.ts";

const withMinimums = (minStats: MinStats) => ({ ...noConstraints, minStats });
const statsOf = (items: { name: string }[], champion: "katarina" | "yone" = "katarina", level = 11) =>
  panelStats(champion, level, items.map((i) => getItem(i.name)), champion === "yone" ? "q" : "r");

test("Mid, hybrid Katarina: every build in the top 5 has 150+ AP and 150+ AD", () => {
  const minStats = { abilityPower: 150, attackDamage: 150 };
  const top = findTopBuilds({ ...presetInput("squishy", "mid"), constraints: withMinimums(minStats) });
  expect(top.length).toBeGreaterThan(0);
  for (const build of top) expect(meetsMinimums(statsOf(build.items), minStats), build.items.map((i) => i.name).join(" + ")).toBe(true);
});

test("Mid, Yone Q: 100% crit chance means two crit items (his passive doubles them)", () => {
  const minStats = { critChance: 1 };
  const top = findTopBuilds({ ...presetInput("bruiser", "mid", "tier2", "q", "yone"), constraints: withMinimums(minStats) });
  expect(top.length).toBeGreaterThan(0);
  for (const build of top) expect(statsOf(build.items, "yone").critChance).toBeCloseTo(1);
});

test("a build of the normal top 5 that reaches the minimums is also in the top 5 with minimums", () => {
  // Minimums only take builds away, so a build that fits keeps its place or moves up.
  const input = presetInput("tank", "mid");
  const minStats = { attackDamage: 170 }; // 3 of the normal top 5 have it (171, 176, 181 AD), 2 don't
  const normal = everyBuildSearch(input);
  const fitting = normal.filter((b) => meetsMinimums(statsOf(b.items), minStats));
  expect(fitting.length).toBeGreaterThan(0); // otherwise this test checks nothing
  const withMin = summary(everyBuildSearch({ ...input, constraints: withMinimums(minStats) }));
  for (const line of summary(fitting)) expect(withMin).toContain(line);
});

test("a minimum no build can reach gives no builds (the page says so)", () => {
  const top = findTopBuilds({ ...presetInput("squishy", "early"), constraints: withMinimums({ abilityPower: 5000 }) });
  expect(top).toEqual([]);
});

test("the beam (3 free slots) also only returns builds that reach the minimums", () => {
  const minStats = { abilityPower: 200, attackDamage: 200 };
  const top = beamSearch({ ...presetInput("bruiser", "late"), constraints: withMinimums(minStats) }, 300);
  expect(top.length).toBeGreaterThan(0);
  for (const build of top) expect(meetsMinimums(statsOf(build.items, "katarina", 16), minStats)).toBe(true);
}, 60_000);

test("a minimum on armor keeps Frozen Heart in the search (the filter would remove it)", () => {
  expect(legendaryPool().removedByFilter.map((i) => i.name)).toContain("Frozen Heart");
  expect(legendaryPool(true, ["armor"]).removedByFilter.map((i) => i.name)).not.toContain("Frozen Heart");
});

test("bad minimums are refused with a plain message", () => {
  expect(constraintProblem(withMinimums({ abilityPower: -5 }), "tier2", 2)).toMatch(/AP/);
  expect(constraintProblem(withMinimums({ abilityPower: Number.NaN }), "tier2", 2)).toMatch(/AP/);
  expect(constraintProblem(withMinimums({ abilityPower: 150 }), "tier2", 2)).toBeNull();
});
