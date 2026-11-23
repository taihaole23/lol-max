import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";
import { run } from "./helpers.ts";

test("one big hit on dagger 1, then 5 leftover-stack hits every 0.25 s, all × 0.35 (the Death Lotus bug)", () => {
  const ap = katarinaStats(16, [getItem("Luden's Echo")]).ap;
  const hits = run(16, ["Luden's Echo"]).events.filter((e) => e.source === "Luden's Echo");
  expect(hits.map((e) => e.time)).toEqual([0, 0.25, 0.5, 0.75, 1, 1.25]);
  expect(hits[0].amount).toBeCloseTo((75 + 0.05 * ap) * 0.35);
  for (const hit of hits.slice(1)) expect(hit.amount).toBeCloseTo((15 + 0.01 * ap) * 0.35);
});

test("the bug uses R's rank: × 0.25 at rank 1 (level 6)", () => {
  const ap = katarinaStats(6, [getItem("Luden's Echo")]).ap;
  const hits = run(6, ["Luden's Echo"]).events.filter((e) => e.source === "Luden's Echo");
  expect(hits[0].amount).toBeCloseTo((75 + 0.05 * ap) * 0.25);
});

test("every simulation starts with the stacks full again", () => {
  run(16, ["Luden's Echo"]);
  expect(run(16, ["Luden's Echo"]).events.filter((e) => e.source === "Luden's Echo")).toHaveLength(6);
});
