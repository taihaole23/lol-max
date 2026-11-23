import { test, expect } from "vitest";
import { run, easyDummy } from "./helpers.ts";

const armoredDummy = { ...easyDummy, baseArmor: 100 };

// R's physical damage per dagger, in dagger order.
function physicalHits(target = armoredDummy) {
  return run(16, ["Black Cleaver"], target).events.filter((e) => e.source === "bonusAdRatio");
}

test("dagger N has min(N, 5) stacks: its own stack counts (wiki: ability damage)", () => {
  const raw = physicalHits(easyDummy); // 0 armor, so this is the damage before armor
  const hits = physicalHits();
  for (let i = 0; i < 15; i++) {
    const stacks = Math.min(i + 1, 5);
    const armor = 100 * (1 - 0.06 * stacks);
    expect(hits[i].amount).toBeCloseTo(raw[i].amount * (100 / (100 + armor)));
  }
});

test("magic damage is not changed (it's armor reduction)", () => {
  const withArmor = run(16, ["Black Cleaver"], armoredDummy).events.filter((e) => e.source === "base");
  const without = run(16, ["Black Cleaver"]).events.filter((e) => e.source === "base");
  expect(withArmor[14].amount).toBeCloseTo(without[14].amount);
});

test("every simulation starts with 0 stacks", () => {
  const first = physicalHits()[0].amount;
  expect(physicalHits()[0].amount).toBeCloseTo(first);
});
