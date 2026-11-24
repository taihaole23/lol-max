import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { run } from "./helpers.ts";

test("full Momentum: dagger 1 only, 40 + 100% base AD physical, × 0.35", () => {
  const baseAd = championStats("katarina", 16, [getItem("Dead Man's Plate")]).baseAd;
  const hits = run(16, ["Dead Man's Plate"]).events.filter((e) => e.source === "Dead Man's Plate");
  expect(hits).toHaveLength(1);
  expect(hits[0].time).toBe(0);
  expect(hits[0].type).toBe("physical");
  expect(hits[0].amount).toBeCloseTo((40 + baseAd) * 0.35);
});
