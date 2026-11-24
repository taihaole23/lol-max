import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { run } from "./helpers.ts";

test("procs on daggers 5, 10 and 15 for 120% base AD + 5% of her max HP, × 0.35", () => {
  const times = run(16, []).events.filter((e) => e.source === "base").map((e) => e.time);
  const stats = championStats("katarina", 16, [getItem("Hullbreaker")]);
  const procs = run(16, ["Hullbreaker"]).events.filter((e) => e.source === "Hullbreaker");
  expect(procs.map((e) => e.time)).toEqual([4, 9, 14].map((i) => times[i]));
  for (const proc of procs) {
    expect(proc.type).toBe("physical");
    expect(proc.amount).toBeCloseTo((1.2 * stats.baseAd + 0.05 * stats.health) * 0.35);
  }
});
