// "Maximize": ranking builds by stats instead of damage (search.ts, balanced score).
import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { noConstraints } from "../../src/optimizer/constraints.ts";
import { everyBuildSearch, findTopBuilds } from "../../src/optimizer/search.ts";
import type { FoundBuild } from "../../src/optimizer/top-builds.ts";
import { panelStats, type MinStats, type PanelStat } from "../../src/stats/stat-panel.ts";
import { presetInput } from "./helpers.ts";

const constraints = (maximize: PanelStat[], minStats: MinStats = {}) => ({ ...noConstraints, maximize, minStats });
const statsOf = (build: FoundBuild, champion: "katarina" | "yone" = "katarina") =>
  panelStats(champion, 11, build.items.map((i) => getItem(i.name)), champion === "yone" ? "q" : "r");

test("maximize AP: the top build has the most AP of any build, and the 5 go down in AP", () => {
  const input = presetInput("squishy", "mid");
  const top = findTopBuilds({ ...input, constraints: constraints(["abilityPower"]) });
  expect(top).toHaveLength(5);
  const peak = everyBuildSearch({ ...input, peakOf: "abilityPower" })[0].score!;
  expect(statsOf(top[0]).abilityPower).toBeCloseTo(peak);
  for (let i = 1; i < top.length; i++) expect(statsOf(top[i - 1]).abilityPower).toBeGreaterThanOrEqual(statsOf(top[i]).abilityPower - 1e-6);
});

test("Yone, maximize crit: every build is at 100% crit, and damage decides the order", () => {
  const top = findTopBuilds({ ...presetInput("bruiser", "mid", "tier2", "q", "yone"), constraints: constraints(["critChance"]) });
  expect(top).toHaveLength(5);
  for (const build of top) expect(statsOf(build, "yone").critChance).toBeCloseTo(1);
  for (let i = 1; i < top.length; i++) expect(top[i - 1].damage).toBeGreaterThanOrEqual(top[i].damage);
});

test("maximize AP + AD (balanced): the winner's weaker side beats the pure-AP and pure-AD winners'", () => {
  const input = presetInput("squishy", "mid");
  const peak = (stat: PanelStat) => everyBuildSearch({ ...input, peakOf: stat })[0].score!;
  const [apPeak, adPeak] = [peak("abilityPower"), peak("attackDamage")];
  const weaker = (b: FoundBuild) => Math.min(statsOf(b).abilityPower / apPeak, statsOf(b).attackDamage / adPeak);

  const hybrid = findTopBuilds({ ...input, constraints: constraints(["abilityPower", "attackDamage"]) })[0];
  const apOnly = findTopBuilds({ ...input, constraints: constraints(["abilityPower"]) })[0];
  const adOnly = findTopBuilds({ ...input, constraints: constraints(["attackDamage"]) })[0];
  expect(hybrid.score).toBeCloseTo(weaker(hybrid));
  expect(weaker(hybrid)).toBeGreaterThan(weaker(apOnly));
  expect(weaker(hybrid)).toBeGreaterThan(weaker(adOnly));
}, 60_000); // 5 searches: over Vitest's 5 s default when the whole suite runs at once

test("maximize follows minimums: the AP peak is measured among builds with 150+ AD", () => {
  const top = findTopBuilds({ ...presetInput("squishy", "mid"), constraints: constraints(["abilityPower"], { attackDamage: 150 }) });
  expect(top.length).toBeGreaterThan(0);
  for (const build of top) expect(statsOf(build).attackDamage).toBeGreaterThanOrEqual(150 - 1e-6);
});

test("nothing to maximize = ranked by damage, as before", () => {
  const input = presetInput("tank", "mid");
  const normal = findTopBuilds(input);
  expect(findTopBuilds({ ...input, constraints: constraints([]) })).toEqual(normal);
  expect(normal.every((b) => b.score === undefined)).toBe(true);
});
