import { test, expect } from "vitest";
import { krakenDamage } from "../../src/items/kraken-slayer.ts";
import { easyDummy, run } from "./helpers.ts";

const daggerTimes = () => run(16, []).events.filter((e) => e.source === "base").map((e) => e.time);

test("damage by level: 150 up to level 8, then +5 per level (200 at 18)", () => {
  expect(krakenDamage(6)).toBe(150);
  expect(krakenDamage(8)).toBe(150);
  expect(krakenDamage(9)).toBe(155);
  expect(krakenDamage(16)).toBe(190);
  expect(krakenDamage(18)).toBe(200);
});

test("procs on daggers 3, 6, 9, 12 and 15", () => {
  const times = daggerTimes();
  const procs = run(16, ["Kraken Slayer"]).events.filter((e) => e.source === "Kraken Slayer");
  expect(procs.map((e) => e.time)).toEqual([2, 5, 8, 11, 14].map((i) => times[i]));
});

test("190 × (1 + 75% × missing health) × 0.35, missing health read just before the proc", () => {
  const events = run(16, ["Kraken Slayer"]).events;
  events.forEach((event, i) => {
    if (event.source !== "Kraken Slayer") return;
    const dealtBefore = events.slice(0, i).reduce((sum, e) => sum + e.amount, 0);
    const missing = dealtBefore / easyDummy.hp; // the dummy never reaches 1 HP here
    expect(event.amount).toBeCloseTo(190 * (1 + 0.75 * missing) * 0.35);
  });
});

test("with Guinsoo's, Phantom Hits give extra stacks, so it procs more often", () => {
  const alone = run(16, ["Kraken Slayer"]).events.filter((e) => e.source === "Kraken Slayer");
  const withGuinsoos = run(16, ["Kraken Slayer", "Guinsoo's Rageblade"]).events.filter((e) => e.source === "Kraken Slayer");
  expect(withGuinsoos.length).toBe(alone.length + 1); // 15 daggers + 3 Phantom Hits = 18 on-hits = 6 procs
});
