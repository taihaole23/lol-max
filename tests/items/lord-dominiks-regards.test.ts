import { test, expect } from "vitest";
import { lordDominiksRegards } from "../../src/items/lord-dominiks-regards.ts";
import { ampRatios, easyDummy } from "./helpers.ts";

const ratios = (bonusHp: number) => ampRatios(lordDominiksRegards, { ...easyDummy, bonusHp });

test("1% more damage per 100 bonus HP: 800 → 8%, every damage type", () => {
  for (const event of ratios(800)) expect(event.ratio).toBeCloseTo(1.08);
});

test("capped at 15% (1500 bonus HP)", () => {
  for (const event of ratios(3000)) expect(event.ratio).toBeCloseTo(1.15);
});

test("no bonus HP, no bonus damage", () => {
  for (const event of ratios(0)) expect(event.ratio).toBeCloseTo(1);
});
