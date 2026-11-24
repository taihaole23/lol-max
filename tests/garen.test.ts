// Garen: his data, each ability's formula (Q's attack + bonus, E's spins, R's missing health), which
// pieces count as ability damage, E's armor reduction and average crits, the dummy's health box,
// and his skill order.
import { test, expect } from "vitest";
import { garen } from "../src/data/garen.ts";
import { getItem } from "../src/data/items.ts";
import { PATCH } from "../src/data/patch.ts";
import { isModelled } from "../src/data/playable-champions.ts";
import { abilityCast } from "../src/simulation/abilities.ts";
import {
  decisiveStrikeCast,
  judgmentCritMultiplier,
  judgmentHitTimes,
  judgmentSpinParts,
  judgmentSpins,
} from "../src/simulation/garen-abilities.ts";
import { critTotals, simulateBuild } from "../src/simulation/simulate-build.ts";
import { simulateCast, type Attacker, type DamageInfo, type Target } from "../src/simulation/simulate.ts";
import { recommendedRanks } from "../src/stats/ability-ranks.ts";
import { championStats } from "../src/stats/champion-stats.ts";
import * as actions from "../src/ui/state.ts";

// No armor or MR, and so much HP that the overkill rule never kicks in.
const bigDummy: Target = { hp: 1_000_000, bonusHp: 0, baseArmor: 0, bonusArmor: 0, baseMagicResist: 0, bonusMagicResist: 0 };

const cast = (ability: "q" | "e" | "r", itemNames: string[] = [], target: Target = bigDummy, level = 18) =>
  simulateBuild("garen", level, itemNames.map(getItem), target, ability === "r" ? 3 : 5, ability).events;
const total = (events: { amount: number }[]) => events.reduce((sum, e) => sum + e.amount, 0);
const stats = (itemNames: string[] = [], level = 18): Attacker => championStats("garen", level, itemNames.map(getItem), "q");

// AD at level 18: 69 + 4.5 × 17 × (0.7025 + 0.0175 × 17) = 69 + 76.5 × 1 = 145.5.
const adAt18 = 145.5;

// ---- Data ----

test("every source is for the site's patch", () => {
  for (const group of [garen.baseStats, garen.abilities, garen.decisiveStrike, garen.judgment, garen.demacianJustice]) {
    expect(group.source.patch).toBe(PATCH);
  }
});

test("rank lists have one number per rank (5 for Q and E, 3 for R)", () => {
  expect(garen.decisiveStrike.physicalBonusDamage).toHaveLength(5);
  expect(garen.judgment.physicalDamagePerSpin).toHaveLength(5);
  expect(garen.judgment.adRatioPerSpin).toHaveLength(5);
  expect(garen.demacianJustice.trueBaseDamage).toHaveLength(3);
  expect(garen.demacianJustice.missingHealthRatio).toHaveLength(3);
});

test("E: the wiki's 'increased damage per spin' = base × 1.25 (5 / 8.75 / 12.5 / 16.25 / 20 + 50 / 53.75 / ...% AD)", () => {
  const e = garen.judgment;
  const bonus = 1 + e.nearestEnemyBonus;
  [5, 8.75, 12.5, 16.25, 20].forEach((d, i) => expect(e.physicalDamagePerSpin[i] * bonus).toBeCloseTo(d, 10));
  [0.5, 0.5375, 0.575, 0.6125, 0.65].forEach((r, i) => expect(e.adRatioPerSpin[i] * bonus).toBeCloseTo(r, 10));
});

test("base AD at level 18 is 145.5 (the wiki's growth formula)", () => {
  expect(stats().baseAd).toBeCloseTo(adAt18, 10);
});

// ---- Q: Decisive Strike ----

test("Q: the attack (100% AD) + the bonus (150 + 50% AD) at rank 5", () => {
  expect(total(cast("q"))).toBeCloseTo(adAt18 + 150 + 0.5 * adAt18, 6);
});

test("Q crit: only the attack part doubles", () => {
  // Zero crit chance with no items, so critTotals is worked out without items: the crit adds 100% AD.
  const crit = critTotals("garen", 18, [], bigDummy, 5, "q")!;
  expect(crit.crit - crit.noCrit).toBeCloseTo(adAt18, 6);
  expect(crit.chance).toBe(0);
});

test("Q: the attack is basic damage, the bonus is ability damage", () => {
  const seen: { source: string; info: DamageInfo }[] = [];
  const spy = { name: "spy", beforeDamage: () => {}, afterDamage: () => {} };
  const recorder = {
    ...spy,
    beforeDamage: (_c: unknown, info: DamageInfo) => seen.push({ source: "", info }),
  };
  const result = simulateCast({ cast: decisiveStrikeCast(5, false), attacker: stats(), target: bigDummy, items: [recorder] });
  const kinds = result.events.map((event, i) => [event.source, seen[i].info.abilityDamage]);
  expect(kinds).toEqual([
    ["attack", false],
    ["base", true],
    ["adRatio", true],
  ]);
});

test("Q applies on-hit at full strength (Blade of the Ruined King: 9% of current health)", () => {
  const dummy = { ...bigDummy, hp: 3000 };
  const botrk = cast("q", ["Blade of The Ruined King"], dummy).filter((e) => e.source === "Blade of The Ruined King");
  expect(total(botrk)).toBeCloseTo(0.09 * 3000, 6);
});

// ---- E: Judgment ----

test("E spins 7 times, +1 per full 25% bonus attack speed (items and levels)", () => {
  const withAs = (bonusAttackSpeed: number) => judgmentSpins({ ...stats(), bonusAttackSpeed });
  expect(withAs(0)).toBe(7);
  expect(withAs(0.24)).toBe(7);
  expect(withAs(0.25)).toBe(8);
  expect(withAs(0.75)).toBe(10); // not 9 from 0.75 / 0.25 = 2.9999...
  expect(judgmentSpins(stats([], 1))).toBe(7); // level 1: no bonus attack speed
  // Level 18: 3.65% × 17 × 1 = 62.05% bonus attack speed → 2 extra spins.
  expect(judgmentSpins(stats())).toBe(9);
});

test("E's spins land at the end of each turn, evenly over 3 s", () => {
  const times = judgmentHitTimes(7);
  expect(times).toHaveLength(7);
  expect(times[0]).toBeCloseTo(3 / 7, 10);
  expect(times[6]).toBeCloseTo(3, 10);
});

test("E at rank 5, level 18: 9 spins of (16 + 52% AD) × 1.25", () => {
  const perSpin = (16 + 0.52 * adAt18) * 1.25;
  expect(total(cast("e"))).toBeCloseTo(9 * perSpin, 6);
});

test("E: 25% armor reduction from the 7th spin on", () => {
  const armored: Target = { ...bigDummy, baseArmor: 100 };
  const perSpin = (16 + 0.52 * adAt18) * 1.25;
  // Spins 1-6: 100 armor (× 0.5). Spins 7-9: 75 armor (× 100 / 175).
  expect(total(cast("e", [], armored))).toBeCloseTo(perSpin * (6 * 0.5 + 3 * (100 / 175)), 6);
});

test("E crits: 130% damage (139% with Infinity Edge), counted at their average", () => {
  expect(judgmentCritMultiplier({ ...stats(), critDamage: 2 })).toBeCloseTo(1.3, 10);
  expect(judgmentCritMultiplier({ ...stats(), critDamage: 2.3 })).toBeCloseTo(1.39, 10);
  // 50% crit chance: each spin deals 50% of the crit's extra 30% = 15% more, on average.
  const parts = judgmentSpinParts(5, { ...stats(), critChance: 0.5, critDamage: 2 });
  const spin = (16 + 0.52 * adAt18) * 1.25;
  expect(parts.find((p) => p.source === "averageCrit")!.raw).toBeCloseTo(spin * 0.15, 6);
});

test("E doesn't apply on-hit effects", () => {
  const botrk = cast("e", ["Blade of The Ruined King"], { ...bigDummy, hp: 3000 }).filter((e) => e.source === "Blade of The Ruined King");
  expect(botrk).toHaveLength(0);
});

test("E is one cast instance: Eclipse gets one stack from the whole spin, so it never procs", () => {
  const eclipse = cast("e", ["Eclipse"], { ...bigDummy, hp: 3000 }).filter((e) => e.source === "Eclipse");
  expect(eclipse).toHaveLength(0);
});

// ---- R: Demacian Justice ----

test("R on a full-health dummy: only its base damage (275 true at rank 3), armor or not", () => {
  expect(total(cast("r", [], { ...bigDummy, baseArmor: 200 }))).toBeCloseTo(275, 6);
});

test("R at 40% health: 275 + 35% of the missing 60%", () => {
  const dummy: Target = { ...bigDummy, hp: 1000, startHpShare: 0.4 };
  const events = cast("r", [], dummy);
  expect(total(events)).toBeCloseTo(275 + 0.35 * 600, 6);
  expect(events.every((e) => e.type === "true")).toBe(true);
});

// ---- Which abilities, the health box, skill order ----

test("Q, E and R are calculated; W deals no damage", () => {
  expect(isModelled("garen", "q")).toBe(true);
  expect(isModelled("garen", "e")).toBe(true);
  expect(isModelled("garen", "r")).toBe(true);
  expect(isModelled("garen", "w")).toBe(false);
  expect(() => abilityCast("garen", "w", 5, false, stats())).toThrow();
});

test("the dummy's health box: every ability uses it, and it starts at 100% (a full dummy)", () => {
  const onGaren = actions.selectChampion(actions.initialState(), "garen");
  const r = actions.selectAbility(onGaren, "r");
  expect(r.dummyHealthPercent).toBe(100);
  expect(actions.dummyTarget(r).startHpShare).toBeUndefined(); // 100%: a full dummy
  const at40 = actions.setDummyHealthPercent(r, 40);
  expect(actions.dummyTarget(at40).startHpShare).toBeCloseTo(0.4, 10);
  // Every other ability and champion too (Eric: items read the dummy's health for any ability).
  expect(actions.dummyTarget(actions.selectAbility(at40, "q")).startHpShare).toBeCloseTo(0.4, 10);
  expect(actions.dummyTarget(actions.selectChampion(at40, "katarina")).startHpShare).toBeCloseTo(0.4, 10);
  // Kept between 1 and 100; an empty box goes back to 100.
  expect(actions.setDummyHealthPercent(r, 0).dummyHealthPercent).toBe(1);
  expect(actions.setDummyHealthPercent(r, 150).dummyHealthPercent).toBe(100);
  expect(actions.setDummyHealthPercent(at40, null).dummyHealthPercent).toBe(100);
});

test("a lower starting health raises Akali's R2 and lowers BotRK's current-health damage", () => {
  const dummy = (startHpShare?: number): Target => ({ ...bigDummy, hp: 3000, ...(startHpShare ? { startHpShare } : {}) });
  const akaliR = (target: Target) => total(simulateBuild("akali", 18, [], target, 3, "r").events);
  expect(akaliR(dummy(0.5))).toBeGreaterThan(akaliR(dummy()));
  // Garen's Q with BotRK: 9% of the dummy's CURRENT health, 3000 at full, 1500 at 50%.
  const botrk = (target: Target) => total(cast("q", ["Blade of The Ruined King"], target).filter((e) => e.source === "Blade of The Ruined King"));
  expect(botrk(dummy())).toBeCloseTo(0.09 * 3000, 6);
  expect(botrk(dummy(0.5))).toBeCloseTo(0.09 * 1500, 6);
});

test("skill order: R whenever possible, then max E, then Q, then W", () => {
  expect(recommendedRanks("garen", 6)).toEqual({ q: 1, w: 1, e: 3, r: 1 });
  expect(recommendedRanks("garen", 11)).toEqual({ q: 3, w: 1, e: 5, r: 2 });
  expect(recommendedRanks("garen", 18)).toEqual({ q: 5, w: 5, e: 5, r: 3 });
});
