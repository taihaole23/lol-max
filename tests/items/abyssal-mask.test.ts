import { test, expect } from "vitest";
import { abyssalMask } from "../../src/items/abyssal-mask.ts";
import { nashorsTooth } from "../../src/items/nashors-tooth.ts";
import { ampRatios } from "./helpers.ts";

test("magic damage is 12% bigger, including item magic damage", () => {
  const magic = ampRatios(abyssalMask, undefined, [nashorsTooth]).filter((e) => e.type === "magic");
  expect(magic.some((e) => e.source === "Nashor's Tooth")).toBe(true);
  for (const event of magic) expect(event.ratio).toBeCloseTo(1.12);
});

test("physical damage is not changed", () => {
  const physical = ampRatios(abyssalMask).filter((e) => e.type === "physical");
  for (const event of physical) expect(event.ratio).toBeCloseTo(1);
});
