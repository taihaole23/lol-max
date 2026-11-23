import { test, expect } from "vitest";
import { run, easyDummy } from "./helpers.ts";

const mrDummy = { ...easyDummy, baseMagicResist: 100 };

// R's base magic damage per dagger, in dagger order.
function baseHits(itemNames: string[], target = mrDummy) {
  return run(16, itemNames, target).events.filter((e) => e.source === "base");
}

test("dagger N has min(N - 1, 4) stacks: a stack counts only after its hit", () => {
  const raw = baseHits(["Bloodletter's Curse"], easyDummy);
  const hits = baseHits(["Bloodletter's Curse"]);
  for (let i = 0; i < 15; i++) {
    const stacks = Math.min(i, 4);
    const mr = 100 * (1 - 0.075 * stacks);
    expect(hits[i].amount).toBeCloseTo(raw[i].amount * (100 / (100 + mr)));
  }
});

test("one dagger adds one stack, though its magic damage is two pieces", () => {
  // If base and AP ratio each added a stack, dagger 2 would already have 2.
  const raw = baseHits(["Bloodletter's Curse"], easyDummy);
  const hits = baseHits(["Bloodletter's Curse"]);
  expect(hits[1].amount).toBeCloseTo(raw[1].amount * (100 / (100 + 92.5)));
});

test("item on-hit damage doesn't add stacks (Nashor's hits don't speed it up)", () => {
  const alone = baseHits(["Bloodletter's Curse"]);
  const withNashors = baseHits(["Bloodletter's Curse", "Nashor's Tooth"]);
  // Nashor's has no magic pen, so the same MR means the same multiplier.
  const ratio = (hits: typeof alone, i: number) => hits[i].amount / hits[0].amount;
  for (let i = 0; i < 15; i++) expect(ratio(withNashors, i)).toBeCloseTo(ratio(alone, i));
});

test("physical damage is not changed (it's MR reduction)", () => {
  const withMr = run(16, ["Bloodletter's Curse"], { ...mrDummy, baseArmor: 0 }).events;
  const without = run(16, ["Bloodletter's Curse"]).events;
  const physical = (events: typeof withMr) => events.filter((e) => e.type === "physical");
  expect(physical(withMr)).toEqual(physical(without));
});
