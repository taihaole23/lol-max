// Sunfire Aegis and Hollow Radiance ("Immolate").
import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";
import { run } from "./helpers.ts";

function immolate(name: string) {
  const stats = katarinaStats(16, [getItem(name)]);
  const bonusHealth = stats.health - stats.baseHealth;
  const ticks = run(16, [name]).events.filter((e) => e.source === name);
  return { bonusHealth, ticks };
}

test("Sunfire: 20 + 1.5% bonus HP, magic, at 0, 1 and 2 s", () => {
  const { bonusHealth, ticks } = immolate("Sunfire Aegis");
  expect(ticks.map((e) => e.time)).toEqual([0, 1, 2]);
  for (const tick of ticks) {
    expect(tick.type).toBe("magic");
    expect(tick.amount).toBeCloseTo(20 + 0.015 * bonusHealth);
  }
});

test("Hollow Radiance: 15 + 1% bonus HP, at 0, 1 and 2 s", () => {
  const { bonusHealth, ticks } = immolate("Hollow Radiance");
  expect(ticks.map((e) => e.time)).toEqual([0, 1, 2]);
  for (const tick of ticks) expect(tick.amount).toBeCloseTo(15 + 0.01 * bonusHealth);
});

test("bonus HP is only the items' HP (Sunfire's own 350 here)", () => {
  expect(immolate("Sunfire Aegis").bonusHealth).toBeCloseTo(getItem("Sunfire Aegis").stats.health!);
});
