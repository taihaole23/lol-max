import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";
import { addApPercent } from "../../src/stats/ap-percent.ts";
import { fixedAttacker, run } from "./helpers.ts";

const apRatioPieces = (itemNames: string[]) =>
  run(16, itemNames).events.filter((e) => e.source === "apRatio");

test("addApPercent: % AP bonuses add (130 with Rabadon's → +4% → 134, not 135.2)", () => {
  const attacker = { ...fixedAttacker, ap: 130, apPercentBonus: 0.3 };
  addApPercent(attacker, 0.04);
  expect(attacker.ap).toBeCloseTo(134);
  expect(attacker.apPercentBonus).toBeCloseTo(0.34);
});

test("burn: 10 + 1% AP right away and every 0.5 s, 6 ticks, × 0.35 (the Death Lotus bug)", () => {
  const ap = katarinaStats(16, [getItem("Blackfire Torch")]).ap;
  const ticks = run(16, ["Blackfire Torch"]).events.filter((e) => e.source === "Blackfire Torch");
  expect(ticks.map((e) => e.time)).toEqual([0, 0.5, 1, 1.5, 2, 2.5]);
  // The 0 s tick comes with dagger 1, before the +4% AP; the rest use the +4%.
  expect(ticks[0].amount).toBeCloseTo((10 + 0.01 * ap) * 0.35);
  for (const tick of ticks.slice(1)) expect(tick.amount).toBeCloseTo((10 + 0.01 * ap * 1.04) * 0.35);
});

test("+4% AP from dagger 2 on: dagger 1 starts the burn, so it doesn't get it", () => {
  const pieces = apRatioPieces(["Blackfire Torch"]);
  expect(pieces[1].amount / pieces[0].amount).toBeCloseTo(1.04);
  expect(pieces[14].amount / pieces[0].amount).toBeCloseTo(1.04); // and it doesn't stack up
});

test("with Rabadon's the 4% adds to its 30%: AP goes from × 1.3 to × 1.34", () => {
  const pieces = apRatioPieces(["Blackfire Torch", "Rabadon's Deathcap"]);
  expect(pieces[1].amount / pieces[0].amount).toBeCloseTo(1.34 / 1.3);
});

test("every simulation starts without the +4%", () => {
  const first = apRatioPieces(["Blackfire Torch"]);
  const second = apRatioPieces(["Blackfire Torch"]);
  expect(second[0].amount).toBeCloseTo(first[0].amount);
});
