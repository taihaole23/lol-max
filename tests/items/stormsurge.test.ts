import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { easyDummy, run, runAbility } from "./helpers.ts";
import { simulateCast } from "../../src/simulation/simulate.ts";
import { effectsFor } from "../../src/items/index.ts";

// When the damage so far first reaches 25% of the dummy's max HP (or undefined if never).
function triggerTime(dummyHp: number): number | undefined {
  const events = run(16, ["Stormsurge"], { ...easyDummy, hp: dummyHp }).events.filter((e) => e.source !== "Stormsurge");
  let total = 0;
  for (const event of events) {
    total += event.amount;
    if (total >= 0.25 * dummyHp) return event.time;
  }
  return undefined;
}

const strikes = (dummyHp: number) =>
  run(16, ["Stormsurge"], { ...easyDummy, hp: dummyHp }).events.filter((e) => e.source === "Stormsurge");

test("no strike against a dummy too big to reach 25% of its HP", () => {
  expect(strikes(easyDummy.hp)).toHaveLength(0);
});

test("reaching 25% early: one strike of 125 + 10% AP, 2 s later", () => {
  // 1000 HP dummy: 250 damage is reached within the first few daggers.
  const reached = triggerTime(1000)!;
  expect(reached).toBeLessThanOrEqual(0.5);
  const ap = championStats("katarina", 16, [getItem("Stormsurge")]).ap;
  const hits = strikes(1000);
  expect(hits).toHaveLength(1);
  expect(hits[0].time).toBeCloseTo(reached + 2);
  expect(hits[0].amount).toBeCloseTo(125 + 0.1 * ap);
});

test("reaching 25% after 0.5 s: the strike would land after the ult, so it doesn't count", () => {
  const reached = triggerTime(4000);
  expect(reached).toBeGreaterThan(0.5);
  expect(strikes(4000)).toHaveLength(0);
});

// Akali's R1 alone is under 25% of a 1,500 HP dummy, but R1 + R2 (exactly 2.5 s apart) reach it,
// so Squall goes on at 2.5 s and strikes at 4.5 s, inside her 5.5 s window.
test("Akali R: R1 + R2 together (2.5 s apart, inside the window) trigger it; the strike lands at 4.5 s", () => {
  const events = runAbility("akali", "r", ["Stormsurge"], { ...easyDummy, hp: 1500 }).events;
  const r1 = events.filter((e) => e.time === 0).reduce((sum, e) => sum + e.amount, 0);
  expect(r1).toBeLessThan(0.25 * 1500);
  const hits = events.filter((e) => e.source === "Stormsurge");
  expect(hits).toHaveLength(1);
  expect(hits[0].time).toBeCloseTo(4.5);
});

// The window rolls: damage from more than 2.5 s ago no longer counts.
test("a rolling 2.5 s window: two hits 3 s apart, each 15% of max HP, never add up to 25%", () => {
  const hp = 10_000;
  const attacker = championStats("katarina", 16, [getItem("Stormsurge")]);
  const result = simulateCast({
    cast: {
      key: "r",
      hitTimes: [0, 3],
      windowSeconds: 10,
      hitDamage: () => [{ raw: 0.15 * hp, type: "true", source: "base" }],
      appliesOnHit: false,
      appliesOnAttack: false,
      onHitEffectiveness: 0,
      procEffectiveness: 1,
      spellbladeReadyForHits: false,
    },
    attacker,
    target: { ...easyDummy, hp },
    items: effectsFor([getItem("Stormsurge")]),
  });
  expect(result.events.filter((e) => e.source === "Stormsurge")).toHaveLength(0);
});
