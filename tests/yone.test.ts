// Yone: his data (checked against the wiki's own totals), his passive's crit rules, each ability's
// formula, Q's crit peak, Q being basic damage (not ability damage), and his skill order.
import { test, expect } from "vitest";
import { yone } from "../src/data/yone.ts";
import { getItem } from "../src/data/items.ts";
import { PATCH } from "../src/data/patch.ts";
import { isModelled } from "../src/data/playable-champions.ts";
import { explainBuild } from "../src/optimizer/explain.ts";
import { abilityCast } from "../src/simulation/abilities.ts";
import { breakdown } from "../src/simulation/breakdown.ts";
import { critTotals, simulateBuild } from "../src/simulation/simulate-build.ts";
import type { Target } from "../src/simulation/simulate.ts";
import { recommendedRanks } from "../src/stats/ability-ranks.ts";
import { championStats } from "../src/stats/champion-stats.ts";

// No armor or MR, and so much HP that the overkill rule never kicks in.
const bigDummy: Target = { hp: 1_000_000, bonusHp: 0, baseArmor: 0, bonusArmor: 0, baseMagicResist: 0, bonusMagicResist: 0 };
const dummyWithHp = (hp: number): Target => ({ ...bigDummy, hp });

const cast = (ability: "q" | "w" | "r", itemNames: string[] = [], target: Target = bigDummy, rank = ability === "r" ? 3 : 5) =>
  simulateBuild("yone", 18, itemNames.map(getItem), target, rank, ability).events;
const total = (events: { amount: number }[]) => events.reduce((sum, e) => sum + e.amount, 0);
const stats = (itemNames: string[]) => championStats("yone", 18, itemNames.map(getItem), "q");

// AD at level 18: 62 + 2 × 17 × (0.7025 + 0.0175 × 17) = 62 + 34 × 1 = 96.
const baseAdAt18 = 96;

// ---- Data ----

test("every source is for the site's patch", () => {
  for (const group of [yone.baseStats, yone.abilities, yone.critPassive, yone.mortalSteel, yone.spiritCleave, yone.fateSealed]) {
    expect(group.source.patch).toBe(PATCH);
  }
});

test("rank lists have one number per rank (5 for Q and W, 3 for R)", () => {
  expect(yone.mortalSteel.physicalBaseDamage).toHaveLength(5);
  for (const list of Object.values(yone.spiritCleave).filter(Array.isArray)) expect(list).toHaveLength(5);
  expect(yone.fateSealed.magicBaseDamage).toHaveLength(3);
  expect(yone.fateSealed.physicalBaseDamage).toHaveLength(3);
});

test("W: physical + magic = the wiki's total (10 / 20 / 30 / 40 / 50 + 8 / 9 / 10 / 11 / 12% max health)", () => {
  const w = yone.spiritCleave;
  expect(w.physicalBaseDamage.map((d, i) => d + w.magicBaseDamage[i])).toEqual([10, 20, 30, 40, 50]);
  const ratios = w.physicalMaxHealthRatio.map((r, i) => r + w.magicMaxHealthRatio[i]);
  [0.08, 0.09, 0.1, 0.11, 0.12].forEach((r, i) => expect(ratios[i]).toBeCloseTo(r, 10));
});

test("R: magic + physical = the wiki's total (200 / 400 / 600 + 80% bonus AD)", () => {
  const r = yone.fateSealed;
  expect(r.magicBaseDamage.map((d, i) => d + r.physicalBaseDamage[i])).toEqual([200, 400, 600]);
  expect(r.magicBonusAdRatio + r.physicalBonusAdRatio).toBeCloseTo(0.8, 10);
});

test("base AD at level 18 is 96 (the wiki's growth formula)", () => {
  expect(stats([]).baseAd).toBeCloseTo(baseAdAt18, 10);
});

// ---- Passive: crit chance × 2, extra crit → AD, crits at 95% ----

test("passive: no crit items → 0% crit, no bonus AD", () => {
  const s = stats([]);
  expect(s.critChance).toBe(0);
  expect(s.bonusAd).toBe(0);
});

test("passive: one 25% crit item → 50% crit chance", () => {
  // The Collector: 50 AD, 25% crit (its execute is ignored under the overkill rule).
  const s = stats(["The Collector"]);
  expect(s.critChance).toBeCloseTo(0.5, 10);
  expect(s.bonusAd).toBe(50);
});

test("passive: 50% crit from items → exactly 100%, nothing left over for AD", () => {
  const s = stats(["The Collector", "Infinity Edge"]);
  expect(s.critChance).toBe(1);
  expect(s.bonusAd).toBe(50 + 75);
});

test("passive: 75% crit from items → 100% crit and +25 bonus AD (the wiki's 25 AD per 50%)", () => {
  const s = stats(["The Collector", "Infinity Edge", "Lord Dominik's Regards"]);
  expect(s.critChance).toBe(1);
  expect(s.bonusAd).toBeCloseTo(50 + 75 + 35 + 25, 10);
});

test("passive: crits deal 95% of the usual crit damage; Infinity Edge adds 30% to the 200%", () => {
  expect(stats([]).critDamageModifier).toBe(0.95);
  expect(stats([]).critDamage).toBe(2);
  expect(stats(["Infinity Edge"]).critDamage).toBeCloseTo(2.3, 10);
});

test("other champions: crit chance isn't doubled and crits deal the usual damage", () => {
  const kat = championStats("katarina", 18, [getItem("The Collector")]);
  expect(kat.critChance).toBe(0.25);
  expect(kat.critDamageModifier).toBe(1);
});

// ---- Q: Mortal Steel ----

test("Q without crit items: 125 + 105% AD, physical, no crit part", () => {
  const events = cast("q");
  expect(total(events)).toBeCloseTo(125 + 1.05 * baseAdAt18, 6);
  expect(events.every((e) => e.type === "physical")).toBe(true);
  expect(events.some((e) => e.source === "crit")).toBe(false);
});

test("Q crit = the wiki's crit row: 125 + 199.5% AD (+ 29.925% AD with Infinity Edge)", () => {
  // 100% crit chance (two 25% items, doubled), so the cast is the crit run only.
  const items = ["The Collector", "Lord Dominik's Regards"];
  const ad = baseAdAt18 + 50 + 35;
  expect(total(cast("q", items))).toBeCloseTo(125 + 1.995 * ad, 6);

  const withEdge = ["The Collector", "Infinity Edge"];
  const adEdge = baseAdAt18 + 50 + 75;
  expect(total(cast("q", withEdge))).toBeCloseTo(125 + (1.995 + 0.29925) * adEdge, 6);
});

test("Q at 50% crit chance is scored by its peak: the crit", () => {
  const ad = baseAdAt18 + 50; // The Collector
  const noCrit = 125 + 1.05 * ad;
  const crit = 125 + 1.995 * ad;
  expect(total(cast("q", ["The Collector"]))).toBeCloseTo(crit, 6);

  const totals = critTotals("yone", 18, [getItem("The Collector")], bigDummy, 5, "q")!;
  expect(totals.chance).toBeCloseTo(0.5, 10);
  expect(totals.noCrit).toBeCloseTo(noCrit, 6);
  expect(totals.crit).toBeCloseTo(crit, 6);
});

test("Q at 0% crit chance is scored by the no-crit cast (it can never crit)", () => {
  const totals = critTotals("yone", 18, [], bigDummy, 5, "q")!;
  expect(totals.chance).toBe(0);
  expect(total(cast("q"))).toBeCloseTo(totals.noCrit, 6);
});

test("explainBuild gives Q's two numbers, and its total is the peak (the crit)", () => {
  const e = explainBuild("yone", 18, [getItem("The Collector")], bigDummy, 5, "q");
  expect(e.crit).toBeDefined();
  expect(e.breakdown.total).toBeCloseTo(e.crit!.crit, 6);
  // The breakdown still adds up: no items + each item + interactions = total.
  const sum = e.noItemsDamage + e.marginal.reduce((s, m) => s + m.damage, 0) + e.interactions;
  expect(sum).toBeCloseTo(e.breakdown.total, 6);
  // Only Q has crit numbers.
  expect(explainBuild("yone", 18, [getItem("The Collector")], bigDummy, 3, "r").crit).toBeUndefined();
  expect(explainBuild("katarina", 18, [getItem("The Collector")], bigDummy, 3, "r").crit).toBeUndefined();
});

test("Q applies on-hit effects at full strength (Wit's End: 45 magic)", () => {
  const wits = cast("q", ["Wit's End"]).filter((e) => e.source === "Wit's End");
  expect(total(wits)).toBeCloseTo(45, 6);
});

test("Q uses Spellblade (Trinity Force: 200% base AD physical)", () => {
  const trinity = cast("q", ["Trinity Force"]).filter((e) => e.source === "Trinity Force");
  expect(total(trinity)).toBeCloseTo(2 * baseAdAt18, 6);
});

test("Q is basic damage: Liandry's, Luden's and Spear of Shojin ignore it, but not W", () => {
  for (const name of ["Liandry's Torment", "Luden's Echo"]) {
    expect(cast("q", [name]).some((e) => e.source === name), `${name} on Q`).toBe(false);
    expect(cast("w", [name]).some((e) => e.source === name), `${name} on W`).toBe(true);
  }
  // Shojin's amp: Q's damage is the same as with the item's stats alone (the effect never kicks in).
  const ad = stats(["Spear of Shojin"]).baseAd + stats(["Spear of Shojin"]).bonusAd;
  expect(total(cast("q", ["Spear of Shojin"]))).toBeCloseTo(125 + 1.05 * ad, 6);
});

test("Voltaic Cyclosword procs on Q's on-hit, before Q's damage, with its lethality", () => {
  const target = dummyWithHp(10_000);
  const events = cast("q", ["Voltaic Cyclosword"], target);
  expect(events[0].source).toBe("Voltaic Cyclosword");
  expect(events[0].amount).toBeCloseTo(0.08 * 10_000, 6);
  expect(events.filter((e) => e.source === "Voltaic Cyclosword")).toHaveLength(1);
});

// ---- W: Spirit Cleave ----

test("W at rank 5 on a 3,000 HP dummy: 25 + 6% max HP physical, the same again as magic", () => {
  const events = cast("w", [], dummyWithHp(3000));
  const b = breakdown(events);
  expect(b.byType.physical).toBeCloseTo(25 + 0.06 * 3000, 6);
  expect(b.byType.magic).toBeCloseTo(25 + 0.06 * 3000, 6);
  expect(events[0].type).toBe("physical"); // physical lands first (wiki)
  expect(b.bySource.maxHealth).toBeCloseTo(2 * 0.06 * 3000, 6);
});

test("W applies no on-hit effects", () => {
  expect(cast("w", ["Wit's End"]).some((e) => e.source === "Wit's End")).toBe(false);
});

// ---- R: Fate Sealed ----

test("R rank 3 with no bonus AD: 300 magic + 300 physical, magic first", () => {
  const events = cast("r");
  const b = breakdown(events);
  expect(b.byType.magic).toBe(300);
  expect(b.byType.physical).toBe(300);
  expect(events[0].type).toBe("magic");
});

test("R: 40% bonus AD on each half (Bloodthirster's 80 AD)", () => {
  const bonusAd = stats(["Bloodthirster"]).bonusAd;
  expect(total(cast("r", ["Bloodthirster"]))).toBeCloseTo(600 + 0.8 * bonusAd, 6);
});

test("R applies no on-hit effects and doesn't crit", () => {
  expect(cast("r", ["Wit's End"]).some((e) => e.source === "Wit's End")).toBe(false);
  expect(cast("r", ["The Collector", "Infinity Edge"]).some((e) => e.source === "crit")).toBe(false);
});

// ---- Which abilities, skill order ----

test("Q, W and R are calculated; E deals no damage by itself", () => {
  expect(isModelled("yone", "q")).toBe(true);
  expect(isModelled("yone", "w")).toBe(true);
  expect(isModelled("yone", "r")).toBe(true);
  expect(isModelled("yone", "e")).toBe(false);
  expect(() => abilityCast("yone", "e", 5, false, stats([]))).toThrow();
  // W is still "no damage" for Katarina and Akali.
  expect(isModelled("katarina", "w")).toBe(false);
  expect(isModelled("akali", "w")).toBe(false);
  expect(() => abilityCast("katarina", "w", 5, false, stats([]))).toThrow();
});

test("skill order: R whenever possible, then max Q, then W, then E", () => {
  expect(recommendedRanks("yone", 6)).toEqual({ q: 3, w: 1, e: 1, r: 1 });
  expect(recommendedRanks("yone", 11)).toEqual({ q: 5, w: 3, e: 1, r: 2 });
  expect(recommendedRanks("yone", 18)).toEqual({ q: 5, w: 5, e: 5, r: 3 });
});

test("Black Cleaver: Q (basic damage) doesn't benefit from its own stack; W does (ability damage)", () => {
  const armored: Target = { ...bigDummy, baseArmor: 100 };
  const ad = stats(["Black Cleaver"]).baseAd + stats(["Black Cleaver"]).bonusAd;
  // Q: no stack yet when it lands, so 100 armor: × 100 / 200.
  expect(total(cast("q", ["Black Cleaver"], armored))).toBeCloseTo((125 + 1.05 * ad) * 0.5, 6);
  // W's physical part: its own stack (−6% armor = 94) applies, as for every ability hit.
  const wPhysical = cast("w", ["Black Cleaver"], { ...armored, hp: 3000 }).filter((e) => e.type === "physical");
  expect(total(wPhysical)).toBeCloseTo((25 + 0.06 * 3000) * (100 / 194), 6);
});
