import { test, expect } from "vitest";
import { run } from "./helpers.ts";

test("dagger 1 only: 40 + 1.5 × 18 lethality (its own) = 67 true damage", () => {
  const hits = run(16, ["Bastionbreaker"]).events.filter((e) => e.source === "Bastionbreaker");
  expect(hits).toHaveLength(1);
  expect(hits[0].time).toBe(0);
  expect(hits[0].type).toBe("true");
  expect(hits[0].amount).toBeCloseTo(67);
});

test("true damage ignores armor", () => {
  const armored = { hp: 1_000_000, bonusHp: 0, baseArmor: 300, bonusArmor: 0, baseMagicResist: 0, bonusMagicResist: 0 };
  const hits = run(16, ["Bastionbreaker"], armored).events.filter((e) => e.source === "Bastionbreaker");
  expect(hits[0].amount).toBeCloseTo(67);
});
