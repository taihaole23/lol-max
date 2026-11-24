import { test, expect } from "vitest";
import { run, easyDummy } from "./helpers.ts";

const name = "Blade of The Ruined King";

test("9% of the dummy's CURRENT health, read BEFORE that dagger's own damage", () => {
  // On-hit lands before R's own damage (measured in the Practice Tool, Step 8).
  const dummy = { ...easyDummy, hp: 10_000 };
  const { events } = run(16, [name], dummy);
  expect(events[0].source).toBe(name); // dagger 1: BotRK first, at full health
  expect(events[0].amount).toBeCloseTo(0.09 * 10_000 * 0.35);
  // Dagger 2's BotRK reads the health left after all of dagger 1 (BotRK + R's 3 pieces).
  const dagger1 = events.slice(0, 4).reduce((sum, e) => sum + e.amount, 0);
  expect(events[4].source).toBe(name);
  expect(events[4].amount).toBeCloseTo(0.09 * (10_000 - dagger1) * 0.35);
});

test("later daggers deal less, because the dummy has less health", () => {
  const botrk = run(16, [name], { ...easyDummy, hp: 10_000 }).events.filter((e) => e.source === name);
  expect(botrk[14].amount).toBeLessThan(botrk[0].amount);
});

test("overkill rule: at 1 HP each dagger only adds 9% × 1 × 0.35", () => {
  const botrk = run(16, [name], { ...easyDummy, hp: 1 }).events.filter((e) => e.source === name);
  for (const event of botrk) expect(event.amount).toBeCloseTo(0.0315);
});
