// Akali: her data (checked against the wiki's own totals), each ability's formula, R2's
// missing-health bonus, her skill order and her page state.
import { test, expect } from "vitest";
import { akali } from "../src/data/akali.ts";
import { getItem } from "../src/data/items.ts";
import { PATCH } from "../src/data/patch.ts";
import { missingHealthBonus } from "../src/formulas/perfect-execution.ts";
import { breakdown } from "../src/simulation/breakdown.ts";
import { simulateBuild } from "../src/simulation/simulate-build.ts";
import type { Target } from "../src/simulation/simulate.ts";
import { recommendedRanks } from "../src/stats/ability-ranks.ts";
import { championStats } from "../src/stats/champion-stats.ts";
import * as s from "../src/ui/state.ts";

// No armor or MR, and so much HP that R2's missing-health bonus is ~0.
const bigDummy: Target = { hp: 1_000_000, bonusHp: 0, baseArmor: 0, bonusArmor: 0, baseMagicResist: 0, bonusMagicResist: 0 };
const dummyWithHp = (hp: number): Target => ({ ...bigDummy, hp });

const cast = (ability: "q" | "e" | "r", rank: number, target: Target = bigDummy, level = 18) =>
  simulateBuild("akali", level, [], target, rank, ability).events;
const total = (events: { amount: number }[]) => events.reduce((sum, e) => sum + e.amount, 0);

// ---- Data ----

test("every source is for the site's patch", () => {
  for (const group of [akali.baseStats, akali.abilities, akali.fivePointStrike, akali.shurikenFlip, akali.perfectExecution]) {
    expect(group.source.patch).toBe(PATCH);
  }
});

test("rank lists have one number per rank (5 for Q and E, 3 for R)", () => {
  expect(akali.fivePointStrike.magicBaseDamage).toHaveLength(5);
  expect(akali.shurikenFlip.first.magicBaseDamage).toHaveLength(5);
  expect(akali.shurikenFlip.recast.magicBaseDamage).toHaveLength(5);
  expect(akali.perfectExecution.first.magicBaseDamage).toHaveLength(3);
  expect(akali.perfectExecution.recast.magicBaseDamage).toHaveLength(3);
});

test("E: first cast + recast = the wiki's total (70 / 140 / 210 / 280 / 350 + 100% AD + 110% AP)", () => {
  const { first, recast } = akali.shurikenFlip;
  expect(first.magicBaseDamage.map((d, i) => d + recast.magicBaseDamage[i])).toEqual([70, 140, 210, 280, 350]);
  expect(first.magicAdRatio + recast.magicAdRatio).toBeCloseTo(1);
  expect(first.magicApRatio + recast.magicApRatio).toBeCloseTo(1.1);
});

test("level 1 stats are the wiki's base stats", () => {
  const stats = championStats("akali", 1, []);
  expect(stats.health).toBe(600);
  expect(stats.baseAd).toBe(62);
  expect(stats.bonusAd).toBe(0);
  expect(stats.flatMoveSpeed).toBe(345);
});

// ---- R2's missing-health bonus (the wiki table Eric sent) ----

test("missing-health bonus: the wiki table, 0% → +0%, 7% → +20%, 35% → +100%, 70% → +200%", () => {
  const max = 1000;
  expect(missingHealthBonus(1000, max)).toBe(0);
  expect(missingHealthBonus(930, max)).toBeCloseTo(0.2);
  expect(missingHealthBonus(650, max)).toBeCloseTo(1);
  expect(missingHealthBonus(300, max)).toBeCloseTo(2);
});

test("missing-health bonus is capped at +200% past 70% missing, down to 1 HP", () => {
  expect(missingHealthBonus(100, 1000)).toBe(2);
  expect(missingHealthBonus(1, 1000)).toBe(2);
});

// ---- Q ----

test("Q: one magic hit, 145 + 65% TOTAL AD at rank 5 (no items, so no AP)", () => {
  const events = cast("q", 5);
  const totalAd = championStats("akali", 18, []).baseAd;
  expect(events.every((e) => e.time === 0 && e.type === "magic")).toBe(true);
  expect(total(events)).toBeCloseTo(145 + 0.65 * totalAd);
});

// ---- E ----

test("E: first cast and recast both land at 0 s, and the site splits them by name", () => {
  const events = cast("e", 5);
  expect(events.every((e) => e.time === 0 && e.type === "magic")).toBe(true);
  const totalAd = championStats("akali", 18, []).baseAd;
  const b = breakdown(events);
  expect(b.byHit["First cast"]).toBeCloseTo(105 + 0.3 * totalAd);
  expect(b.byHit["Recast"]).toBeCloseTo(245 + 0.7 * totalAd);
  expect(b.total).toBeCloseTo(350 + totalAd);
});

// ---- R ----

test("R: R1 at 0 s, R2 at 2.5 s, all magic", () => {
  const events = cast("r", 3);
  expect(events.every((e) => e.type === "magic")).toBe(true);
  expect([...new Set(events.map((e) => e.time))]).toEqual([0, 2.5]);
});

test("R1: 330 + 50% BONUS AD + 30% AP at rank 3 (no items: only the base)", () => {
  const b = breakdown(cast("r", 3));
  expect(b.byHit["First cast"]).toBeCloseTo(330);
});

test("R2 on a full-HP dummy that R1 barely scratches: about the minimum, 210 at rank 3", () => {
  const b = breakdown(cast("r", 3));
  expect(b.byHit["Recast"]).toBeCloseTo(210 * (1 + missingHealthBonus(1_000_000 - 330, 1_000_000)));
  expect(b.byHit["Recast"]).toBeLessThan(211);
});

test("R2 uses the dummy's HP after R1: 330 out of 1,650 HP is 20% missing → +57.1%", () => {
  const b = breakdown(cast("r", 3, dummyWithHp(1650)));
  expect(b.bySource.missingHealth).toBeCloseTo(210 * (2 * 0.2) / 0.7);
  expect(b.byHit["Recast"]).toBeCloseTo(210 * (1 + 0.4 / 0.7));
});

test("R2 at the maximum (3×) when R1 already took 70% or more", () => {
  const b = breakdown(cast("r", 3, dummyWithHp(400))); // R1's 330 = 82.5% missing
  expect(b.byHit["Recast"]).toBeCloseTo(630);
});

test("overkill rule: the dummy dies to R1, stays at 1 HP, and R2 still counts in full at 3×", () => {
  const b = breakdown(cast("r", 3, dummyWithHp(100)));
  expect(b.byHit["First cast"]).toBeCloseTo(330);
  expect(b.byHit["Recast"]).toBeCloseTo(630);
});

test("magic resist reduces R1 and R2 alike (100 MR halves both, before the bonus)", () => {
  const withMr = breakdown(cast("r", 3, { ...bigDummy, baseMagicResist: 100 }));
  expect(withMr.byHit["First cast"]).toBeCloseTo(165);
});

test("a stronger R1 (more AD) gives R2 a bigger bonus: the build matters", () => {
  const target = dummyWithHp(3000);
  const recast = (items: string[]) =>
    breakdown(simulateBuild("akali", 18, items.map(getItem), target, 3, "r").events).byHit["Recast"];
  expect(recast(["The Collector"])).toBeGreaterThan(recast([]));
});

// ---- Ranks and page ----

test("skill order: R whenever possible, then max Q, then E, then W", () => {
  expect(recommendedRanks("akali", 6)).toEqual({ q: 3, w: 1, e: 1, r: 1 });
  expect(recommendedRanks("akali", 11)).toEqual({ q: 5, w: 1, e: 3, r: 2 });
  expect(recommendedRanks("akali", 18)).toEqual({ q: 5, w: 5, e: 5, r: 3 });
});

test("opening Akali's page: her ranks, her setup, and W can't be calculated", () => {
  const state = s.selectChampion(s.initialState(), "akali");
  expect(state.champion).toBe("akali");
  expect(state.ranks).toEqual(recommendedRanks("akali", state.level));
  expect(s.championSetup(state)).toEqual({ champion: "akali", level: 6, ability: "r", rank: 1, itemCount: 1 });
  expect(s.championSetup(s.selectAbility(state, "w"))).toBeNull();
});

