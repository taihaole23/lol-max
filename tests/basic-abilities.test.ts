// Bouncing Blade (Q) and Shunpo (E): their own damage, and how items behave with a one-hit ability.
import { test, expect } from "vitest";
import { getItem } from "../src/data/items.ts";
import type { DamageAbilityKey } from "../src/data/playable-champions.ts";
import { runSearch } from "../src/optimizer/run-search.ts";
import { breakdown } from "../src/simulation/breakdown.ts";
import { simulateBuild } from "../src/simulation/simulate-build.ts";
import type { DamageEvent } from "../src/simulation/simulate.ts";
import { katarinaStats } from "../src/stats/katarina-stats.ts";
import { baseAdAtLevel16, easyDummy } from "./items/helpers.ts";
import { presetInput } from "./optimizer/helpers.ts";

// One cast at level 16 (Q and E rank 5) with these items, on the easy dummy (no armor or MR, huge HP).
function cast(ability: DamageAbilityKey, itemNames: string[] = [], rank = 5) {
  const result = simulateBuild(16, itemNames.map(getItem), easyDummy, rank, ability);
  return { events: result.events, breakdown: breakdown(result.events) };
}
const from = (events: DamageEvent[], source: string) => events.filter((e) => e.source === source);
const apWith = (ability: DamageAbilityKey, itemNames: string[]) => katarinaStats(16, itemNames.map(getItem), ability).ap;

// ---- Their own damage ----

test("Q: 80 / 115 / 150 / 185 / 220 + 40% AP, magic, one hit at 0 s", () => {
  for (const [rank, base] of [[1, 80], [2, 115], [3, 150], [4, 185], [5, 220]]) {
    expect(cast("q", [], rank).breakdown.total).toBeCloseTo(base); // no items: no AP
  }
  const { events, breakdown: b } = cast("q", ["Rabadon's Deathcap"]);
  expect(b.bySource.apRatio).toBeCloseTo(0.4 * apWith("q", ["Rabadon's Deathcap"]));
  expect(b.byType.magic).toBeCloseTo(b.total);
  expect(new Set(events.map((e) => e.time))).toEqual(new Set([0]));
});

test("E: 20 / 30 / 40 / 50 / 60 + 40% TOTAL AD + 25% AP, all magic", () => {
  const { breakdown: b } = cast("e");
  expect(b.bySource.base).toBeCloseTo(60);
  expect(b.bySource.adRatio).toBeCloseTo(0.4 * baseAdAtLevel16); // no items: base AD only
  expect(b.byType.physical).toBe(0);
  expect(cast("e", [], 1).breakdown.bySource.base).toBeCloseTo(20);

  const withAd = cast("e", ["Lord Dominik's Regards"]).breakdown; // AD item; its passive does nothing here (0 bonus HP)
  const bonusAd = getItem("Lord Dominik's Regards").stats.attackDamage ?? 0;
  expect(withAd.bySource.adRatio).toBeCloseTo(0.4 * (baseAdAtLevel16 + bonusAd));
  expect(cast("e", ["Rabadon's Deathcap"]).breakdown.bySource.apRatio).toBeCloseTo(0.25 * apWith("e", ["Rabadon's Deathcap"]));
});

test("an impossible rank is refused: Q 4 at level 6, E 0", () => {
  expect(() => simulateBuild(6, [], easyDummy, 4, "q")).toThrow();
  expect(() => simulateBuild(6, [], easyDummy, 3, "q")).not.toThrow();
  expect(() => simulateBuild(16, [], easyDummy, 0, "e")).toThrow();
});

// ---- On-hit ----

test("E applies on-hit at full strength (Nashor's: 15 + 15% AP, once)", () => {
  const hits = from(cast("e", ["Nashor's Tooth"]).events, "Nashor's Tooth");
  expect(hits).toHaveLength(1);
  expect(hits[0].amount).toBeCloseTo(15 + 0.15 * apWith("e", ["Nashor's Tooth"]));
});

test("Q applies no on-hit effects", () => {
  expect(from(cast("q", ["Nashor's Tooth"]).events, "Nashor's Tooth")).toHaveLength(0);
  expect(from(cast("q", ["Rapid Firecannon"]).events, "Rapid Firecannon")).toHaveLength(0);
});

test("E: a full Energize bar procs on the hit, unshrunk (Rapid Firecannon 40)", () => {
  const procs = from(cast("e", ["Rapid Firecannon"]).events, "Rapid Firecannon");
  expect(procs).toHaveLength(1);
  expect(procs[0].amount).toBeCloseTo(40);
});

test("E's hit uses its own Spellblade, at full strength (Eric, from playing)", () => {
  const lich = from(cast("e", ["Lich Bane"]).events, "Lich Bane");
  expect(lich).toHaveLength(1);
  expect(lich[0].time).toBe(0);
  expect(lich[0].amount).toBeCloseTo(0.75 * baseAdAtLevel16 + 0.45 * apWith("e", ["Lich Bane"]));

  const trinity = from(cast("e", ["Trinity Force"]).events, "Trinity Force");
  expect(trinity).toHaveLength(1);
  expect(trinity[0].amount).toBeCloseTo(2 * baseAdAtLevel16);
});

test("Dusk and Dawn with E: Spellblade, then on-hit effects once more 0.2 s later", () => {
  const nashors = from(cast("e", ["Dusk and Dawn", "Nashor's Tooth"]).events, "Nashor's Tooth");
  expect(nashors.map((e) => e.time)).toEqual([0, 0.2]);
});

test("Spellblade never procs for Q (it applies no on-hit effects)", () => {
  expect(from(cast("q", ["Lich Bane"]).events, "Lich Bane")).toHaveLength(0);
  expect(from(cast("q", ["Trinity Force"]).events, "Trinity Force")).toHaveLength(0);
});

// ---- Burns and the 3 s window ----

test("Liandry's after Q: 6 full-size ticks (no Death Lotus shrinking), boosted by Suffering", () => {
  const ticks = from(cast("q", ["Liandry's Torment"]).events, "Liandry's Torment");
  expect(ticks.map((e) => e.time)).toEqual([0, 0.5, 1, 1.5, 2, 2.5]);
  // 1% of 1,000,000 = 10,000 per tick; Suffering +2% from 1 s, +4% from 2 s.
  const expected = [1, 1, 1.02, 1.02, 1.04, 1.04].map((amp) => 10_000 * amp);
  ticks.forEach((tick, i) => expect(tick.amount).toBeCloseTo(expected[i]));
});

test("Blackfire after E: 6 ticks of 10 + 1% AP, full size", () => {
  const ticks = from(cast("e", ["Blackfire Torch"]).events, "Blackfire Torch");
  expect(ticks).toHaveLength(6);
  // The first tick comes before Blackfire's +4% AP; later ticks get it.
  const items = [getItem("Blackfire Torch")];
  const stats = katarinaStats(16, items, "e");
  const apBefore = stats.ap;
  const apAfter = (apBefore / (1 + stats.apPercentBonus)) * (1 + stats.apPercentBonus + 0.04);
  expect(ticks[0].amount).toBeCloseTo(10 + 0.01 * apBefore);
  expect(ticks[5].amount).toBeCloseTo(10 + 0.01 * apAfter);
});

test("Luden's after Q: the full hit, then 5 leftover hits of 20% (all inside the window)", () => {
  const hits = from(cast("q", ["Luden's Echo"]).events, "Luden's Echo");
  const ap = apWith("q", ["Luden's Echo"]);
  expect(hits).toHaveLength(6);
  expect(hits[0].amount).toBeCloseTo(75 + 0.05 * ap);
  expect(hits[5].time).toBeCloseTo(1.25);
  expect(hits[5].amount).toBeCloseTo(0.2 * (75 + 0.05 * ap));
});

test("Sunfire keeps itself burning, so it's cut off at 3 s: ticks at 0, 1, 2 and 3", () => {
  const { events } = cast("q", ["Sunfire Aegis"]);
  expect(from(events, "Sunfire Aegis").map((e) => e.time)).toEqual([0, 1, 2, 3]);
  expect(events.every((e) => e.time <= 3)).toBe(true);
});

// ---- Ultimate-only items ----

test("Malignance and Zeke's only work with R", () => {
  for (const ability of ["q", "e"] as const) {
    expect(from(cast(ability, ["Malignance"]).events, "Malignance"), ability).toHaveLength(0);
    expect(from(cast(ability, ["Zeke's Convergence"]).events, "Zeke's Convergence"), ability).toHaveLength(0);
  }
  expect(from(cast("r", ["Malignance"], 3).events, "Malignance").length).toBeGreaterThan(0);
});

test("Experimental Hexplate's Overdrive (+50% attack speed) only switches on for R", () => {
  const hexplate = [getItem("Experimental Hexplate")];
  const r = katarinaStats(16, hexplate, "r").bonusAttackSpeed;
  const q = katarinaStats(16, hexplate, "q").bonusAttackSpeed;
  expect(r - q).toBeCloseTo(0.5);
});

// ---- The optimizer ----

test("the optimizer works for Q and E, and each build's breakdown matches its damage", () => {
  for (const ability of ["q", "e"] as const) {
    const result = runSearch(presetInput("squishy", "early", "tier2", ability));
    expect(result.builds, ability).toHaveLength(5);
    for (const build of result.builds) {
      expect(build.explanation.breakdown.total, ability).toBeCloseTo(build.damage);
    }
    for (let i = 1; i < result.builds.length; i++) {
      expect(result.builds[i].damage).toBeLessThanOrEqual(result.builds[i - 1].damage);
    }
  }
});

test("Q, E and R are different questions: the same build deals different damage", () => {
  const items = [getItem("Luden's Echo")];
  const damage = (ability: DamageAbilityKey, rank: number) =>
    breakdown(simulateBuild(16, items, easyDummy, rank, ability).events).total;
  const all = [damage("q", 5), damage("e", 5), damage("r", 3)];
  expect(new Set(all).size).toBe(3);
});
