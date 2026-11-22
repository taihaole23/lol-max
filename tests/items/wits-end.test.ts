import { test, expect } from "vitest";
import { run, easyDummy } from "./helpers.ts";

test("45 magic damage per dagger at R rank 3 (35%): 15 × 45 × 0.35 = 236.25", () => {
  expect(run(16, ["Wit's End"]).breakdown.bySource["Wit's End"]).toBeCloseTo(236.25);
});

test("at R rank 1 (25%): 15 × 45 × 0.25 = 168.75", () => {
  expect(run(6, ["Wit's End"]).breakdown.bySource["Wit's End"]).toBeCloseTo(168.75);
});

test("it's magic damage, so MR reduces it: 50 MR → × 100/150", () => {
  const dummy = { ...easyDummy, baseMagicResist: 50 };
  expect(run(16, ["Wit's End"], dummy).breakdown.bySource["Wit's End"]).toBeCloseTo(157.5);
});
