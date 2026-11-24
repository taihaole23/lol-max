import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { explainBuild } from "../../src/optimizer/explain.ts";
import { easyDummy } from "../items/helpers.ts";

const explain = (names: string[]) => explainBuild("katarina", 16, names.map(getItem), easyDummy);

test("no items + every marginal + interactions = the total", () => {
  const e = explain(["Rabadon's Deathcap", "Riftmaker", "Nashor's Tooth", "Sorcerer's Shoes"]);
  const marginals = e.marginal.reduce((sum, m) => sum + m.damage, 0);
  expect(e.noItemsDamage + marginals + e.interactions).toBeCloseTo(e.breakdown.total);
});

test("one item: its marginal is everything it adds, and there are no interactions", () => {
  const e = explain(["Nashor's Tooth"]);
  expect(e.marginal[0].damage).toBeCloseTo(e.breakdown.total - e.noItemsDamage);
  expect(e.interactions).toBeCloseTo(0);
});

test("Rabadon's + another AP item boost each other, so interactions are negative", () => {
  // Each item's marginal already includes the boost from the other (Rabadon's × the other
  // item's AP is in BOTH marginals), so the shared part is counted twice and interactions
  // take it back out.
  const e = explain(["Rabadon's Deathcap", "Riftmaker"]);
  expect(e.interactions).toBeLessThan(0);
});
