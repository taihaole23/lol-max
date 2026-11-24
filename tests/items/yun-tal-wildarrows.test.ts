import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { daggerPhysicalDamage } from "../../src/formulas/death-lotus.ts";
import { run } from "./helpers.ts";

test("Flurry: +30% attack speed from dagger 2 on (dagger 1 triggers it)", () => {
  const stats = championStats("katarina", 16, [getItem("Yun Tal Wildarrows")]);
  const physical = run(16, ["Yun Tal Wildarrows"]).events.filter((e) => e.source === "bonusAdRatio");
  expect(physical[0].amount).toBeCloseTo(daggerPhysicalDamage(stats.bonusAd, stats.bonusAttackSpeed));
  for (const piece of physical.slice(1)) {
    expect(piece.amount).toBeCloseTo(daggerPhysicalDamage(stats.bonusAd, stats.bonusAttackSpeed + 0.3));
  }
});

test("every simulation starts without Flurry", () => {
  const first = run(16, ["Yun Tal Wildarrows"]).events.filter((e) => e.source === "bonusAdRatio");
  const second = run(16, ["Yun Tal Wildarrows"]).events.filter((e) => e.source === "bonusAdRatio");
  expect(second[0].amount).toBeCloseTo(first[0].amount);
});
