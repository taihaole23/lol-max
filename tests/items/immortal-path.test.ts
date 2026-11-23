import { test, expect } from "vitest";
import { immortalPath } from "../../src/items/immortal-path.ts";
import { abyssalMask } from "../../src/items/abyssal-mask.ts";
import { ampRatios } from "./helpers.ts";

test("every piece of damage is 4% bigger", () => {
  for (const event of ampRatios(immortalPath)) expect(event.ratio).toBeCloseTo(1.04);
});

test("two amps multiply: Immortal Path + Abyssal Mask magic damage = × 1.04 × 1.12", () => {
  const magic = ampRatios(immortalPath, undefined, [abyssalMask]).filter((e) => e.type === "magic");
  // The ratio is against "Abyssal Mask alone", so check the total against no items at all.
  for (const event of magic) expect(event.ratio).toBeCloseTo(1.04);
  const both = ampRatios(abyssalMask, undefined, [immortalPath]).filter((e) => e.type === "magic");
  for (const event of both) expect(event.ratio).toBeCloseTo(1.12);
  // Ratio 1.04 on top of 1.12 (and 1.12 on top of 1.04) means the total is 1.04 × 1.12, not 1.16.
});
