import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { daggerPhysicalDamage } from "../../src/formulas/death-lotus.ts";
import { run } from "./helpers.ts";

const daggerTimes = () => run(16, []).events.filter((e) => e.source === "base").map((e) => e.time);

test("Wrath: 30 magic per on-hit × 0.35, on 15 daggers + 3 Phantom Hits = 18 × 10.5 = 189", () => {
  expect(run(16, ["Guinsoo's Rageblade"]).breakdown.bySource["Guinsoo's Rageblade"]).toBeCloseTo(189);
});

test("Phantom Hits come 0.15 s after daggers 7, 10 and 13", () => {
  const times = daggerTimes();
  const wrath = run(16, ["Guinsoo's Rageblade"]).events.filter((e) => e.source === "Guinsoo's Rageblade");
  const extra = wrath.map((e) => e.time).filter((t) => !times.includes(t));
  expect(extra).toHaveLength(3);
  [6, 9, 12].forEach((dagger, i) => expect(extra[i]).toBeCloseTo(times[dagger] + 0.15));
});

test("+8% attack speed per dagger, up to 4, each counting from the next dagger", () => {
  const stats = championStats("katarina", 16, [getItem("Guinsoo's Rageblade")]);
  const physical = run(16, ["Guinsoo's Rageblade"]).events.filter((e) => e.source === "bonusAdRatio");
  physical.forEach((piece, dagger) => {
    const stacks = Math.min(dagger, 4);
    const expected = daggerPhysicalDamage(stats.bonusAd, stats.bonusAttackSpeed + 0.08 * stacks);
    expect(piece.amount).toBeCloseTo(expected);
  });
});

test("Phantom Hits apply other items' on-hit effects too (Nashor's: 15 + 3 hits)", () => {
  const nashors = run(16, ["Guinsoo's Rageblade", "Nashor's Tooth"]).events.filter((e) => e.source === "Nashor's Tooth");
  expect(nashors).toHaveLength(18);
});
