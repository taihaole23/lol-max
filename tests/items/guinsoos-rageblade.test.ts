import { test, expect } from "vitest";
import { run } from "./helpers.ts";

test("Wrath: 30 magic damage per dagger: 15 × 30 × 0.35 = 157.5", () => {
  // Seething Strike (attack speed stacks, Phantom hits) is not coded yet (Step 5d-6).
  expect(run(16, ["Guinsoo's Rageblade"]).breakdown.bySource["Guinsoo's Rageblade"]).toBeCloseTo(157.5);
});
