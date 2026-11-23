import { test, expect } from "vitest";
import { shadowflame } from "../../src/items/shadowflame.ts";
import { ampRatios, easyDummy } from "./helpers.ts";

test("above 40% HP: no bonus", () => {
  for (const event of ampRatios(shadowflame)) expect(event.ratio).toBeCloseTo(1);
});

test("below 40% HP: magic damage × 1.2, physical not changed", () => {
  // The dummy starts full, so it has to drop below 40% first: start at 1000 HP (the ult
  // deals about 1150 here), and check the pieces that land after its HP is under 400.
  const startHp = 1000;
  const events = ampRatios(shadowflame, { ...easyDummy, hp: startHp });
  let hp = startHp;
  let checkedOne = false;
  for (const event of events) {
    const below = hp < 0.4 * startHp;
    if (event.type === "magic") expect(event.ratio).toBeCloseTo(below ? 1.2 : 1);
    if (event.type === "physical") expect(event.ratio).toBeCloseTo(1);
    if (below && event.type === "magic") checkedOne = true;
    hp = Math.max(1, hp - event.amount);
  }
  expect(checkedOne).toBe(true); // the test really reached "below 40%"
});
