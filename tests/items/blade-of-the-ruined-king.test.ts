import { test, expect } from "vitest";
import { run, easyDummy } from "./helpers.ts";

const name = "Blade of The Ruined King";

test("9% of the dummy's CURRENT health, read after that dagger's own damage", () => {
  const dummy = { ...easyDummy, hp: 10_000 };
  const { events } = run(16, [name], dummy);
  // The first dagger's R damage (base, AP ratio, AD ratio) lands first, then BotRK.
  const firstDaggerDamage = events[0].amount + events[1].amount + events[2].amount;
  expect(events[3].source).toBe(name);
  expect(events[3].amount).toBeCloseTo(0.09 * (10_000 - firstDaggerDamage) * 0.35);
});

test("later daggers deal less, because the dummy has less health", () => {
  const botrk = run(16, [name], { ...easyDummy, hp: 10_000 }).events.filter((e) => e.source === name);
  expect(botrk[14].amount).toBeLessThan(botrk[0].amount);
});

test("overkill rule: at 1 HP each dagger only adds 9% × 1 × 0.35", () => {
  const botrk = run(16, [name], { ...easyDummy, hp: 1 }).events.filter((e) => e.source === name);
  for (const event of botrk) expect(event.amount).toBeCloseTo(0.0315);
});
