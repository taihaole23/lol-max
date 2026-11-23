import { test, expect } from "vitest";
import { runSearch } from "../../src/optimizer/run-search.ts";
import { presetInput } from "./helpers.ts";

const request = presetInput("tank", "mid");

test("returns 5 builds, each with an explanation that adds up to its damage", () => {
  const result = runSearch(request);
  expect(result.builds).toHaveLength(5);
  for (const build of result.builds) {
    const e = build.explanation;
    expect(e.breakdown.total).toBeCloseTo(build.damage);
    const marginals = e.marginal.reduce((sum, m) => sum + m.damage, 0);
    expect(e.noItemsDamage + marginals + e.interactions).toBeCloseTo(build.damage);
    expect(e.marginal.map((m) => m.item.name)).toEqual(build.items.map((i) => i.name));
  }
});

test("the explanation uses the chosen R rank, not the highest one", () => {
  // Level 16 allows rank 3; ask for rank 1. The explanation must match the search's damage.
  const result = runSearch({ ...presetInput("tank", "late"), rRank: 1 });
  for (const build of result.builds) expect(build.explanation.breakdown.total).toBeCloseTo(build.damage);
});

test("lists the items the filter removed", () => {
  expect(runSearch(request).removedByFilter.map((i) => i.name)).toEqual(["Frozen Heart"]);
});

test("progress: goes up in steps of at least 1%, ends at exactly 1, ~100 messages at most", () => {
  for (const stage of ["mid", "late"] as const) {
    const fractions: number[] = [];
    runSearch(presetInput("tank", stage), (f) => fractions.push(f));
    expect(fractions.at(-1)).toBe(1);
    expect(fractions.length).toBeLessThanOrEqual(101);
    for (let i = 1; i < fractions.length - 1; i++) expect(fractions[i] - fractions[i - 1]).toBeGreaterThanOrEqual(0.01);
  }
}, 30_000);

test("the result survives being copied between threads (structuredClone = the browser's copy)", () => {
  const result = runSearch(request);
  const copy = structuredClone(result);
  expect(copy).toEqual(result);
});
