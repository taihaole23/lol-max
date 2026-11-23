import { test, expect } from "vitest";
import { run, easyDummy } from "./helpers.ts";

const burn = (target = easyDummy) =>
  run(16, ["Liandry's Torment"], target).events.filter((e) => e.source === "Liandry's Torment");

test("burn: 1% of max HP every 0.5 s, 5 ticks, boosted by Suffering (+2% from 1 s, +4% from 2 s)", () => {
  // easyDummy: 1,000,000 HP and 0 MR → 10,000 per tick before Suffering.
  const ticks = burn();
  expect(ticks.map((e) => e.time)).toEqual([0.5, 1, 1.5, 2, 2.5]);
  const expected = [1, 1.02, 1.02, 1.04, 1.04].map((amp) => 10_000 * amp);
  ticks.forEach((tick, i) => expect(tick.amount).toBeCloseTo(expected[i]));
});

test("burn reads MAX HP, not current HP", () => {
  // A 2000 HP dummy is near 1 HP by the end, but every tick is still 1% of 2000 (before Suffering).
  const ticks = burn({ ...easyDummy, hp: 2000 });
  expect(ticks[4].amount).toBeCloseTo(20 * 1.04);
});
