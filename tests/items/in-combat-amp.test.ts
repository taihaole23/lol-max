// Liandry's "Suffering" and Riftmaker's "Void Corruption": +2% per second in combat.
import { test, expect } from "vitest";
import { liandrysTorment } from "../../src/items/liandrys-torment.ts";
import { riftmaker } from "../../src/items/riftmaker.ts";
import { inCombatAmpEffect } from "../../src/items/in-combat-amp.ts";
import type { EffectContext } from "../../src/simulation/simulate.ts";
import { ampRatios } from "./helpers.ts";

for (const item of [liandrysTorment, riftmaker]) {
  test(`${item.name}: 0% before 1 s, 2% from 1 s, 4% from 2 s`, () => {
    for (const event of ampRatios(item)) {
      const expected = event.time < 1 ? 1 : event.time < 2 ? 1.02 : 1.04;
      expect(event.ratio).toBeCloseTo(expected);
    }
  });
}

test("stacks stop at the maximum", () => {
  // The ult is too short to reach Liandry's 3 stacks, so test the helper with faster stacks.
  const effect = inCombatAmpEffect("test", 0.02, 3, 0.5);
  const at = (time: number) => effect.damageMultiplier!({ time } as EffectContext, { type: "magic", fromItem: false, abilityDamage: true });
  expect(at(1.0)).toBeCloseTo(1.04);
  expect(at(1.5)).toBeCloseTo(1.06);
  expect(at(2.5)).toBeCloseTo(1.06);
});
