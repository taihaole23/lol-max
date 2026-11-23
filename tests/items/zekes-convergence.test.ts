import { test, expect } from "vitest";
import { run } from "./helpers.ts";

test("7.5 magic damage every 0.25 s from 0.25 s: 10 ticks inside the ult", () => {
  const ticks = run(16, ["Zeke's Convergence"]).events.filter((e) => e.source === "Zeke's Convergence");
  expect(ticks).toHaveLength(10);
  ticks.forEach((tick, i) => {
    expect(tick.time).toBeCloseTo(0.25 * (i + 1));
    expect(tick.type).toBe("magic");
    expect(tick.amount).toBeCloseTo(7.5);
  });
});
