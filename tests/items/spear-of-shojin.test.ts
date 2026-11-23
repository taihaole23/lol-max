import { test, expect } from "vitest";
import { spearOfShojin } from "../../src/items/spear-of-shojin.ts";
import { nashorsTooth } from "../../src/items/nashors-tooth.ts";
import { ampRatios } from "./helpers.ts";

// Daggers land every 0.166 s. Stacks are added at dagger 1 (0 s), then at the first dagger
// at least 1 s later (dagger 8, 1.162 s), then at least 1 s after that (dagger 15, 2.324 s).
// A hit doesn't benefit from its own stack, so:
//   dagger 1: 0 stacks, daggers 2-8: 1 stack, daggers 9-15: 2 stacks.
// (The 3rd stack comes on the last dagger, too late to boost anything.)
test("R's damage: +0% on dagger 1, +3% on daggers 2-8, +6% on daggers 9-15", () => {
  const rEvents = ampRatios(spearOfShojin).filter((e) => !e.fromItem);
  for (const event of rEvents) {
    const dagger = Math.round(event.time / 0.166) + 1;
    const expected = dagger === 1 ? 1 : dagger <= 8 ? 1.03 : 1.06;
    expect(event.ratio).toBeCloseTo(expected);
  }
});

test("item on-hit damage is not boosted (our assumption)", () => {
  const nashors = ampRatios(spearOfShojin, undefined, [nashorsTooth]).filter((e) => e.fromItem);
  expect(nashors).toHaveLength(15);
  for (const event of nashors) expect(event.ratio).toBeCloseTo(1);
});

test("every simulation starts with 0 stacks", () => {
  ampRatios(spearOfShojin);
  expect(ampRatios(spearOfShojin)[0].ratio).toBeCloseTo(1);
});
