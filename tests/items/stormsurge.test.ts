import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";
import { easyDummy, run } from "./helpers.ts";

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
  const ap = katarinaStats(16, [getItem("Stormsurge")]).ap;
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
