// Compares the calculator with real damage measured in the game's Practice Tool (Step 8).
// Cases and measurements live in practice-tool-cases.ts. A case with no measurement yet is skipped.
import { test, expect } from "vitest";
import { PATCH } from "../src/data/patch.ts";
import { practiceDummy } from "../src/data/practice-tool.ts";
import { expectedDamage, measuredOnPatch, practiceCases } from "./practice-tool-cases.ts";

// How close the calculator must be: within 1% (or 3 damage, for small numbers).
// The game shows whole numbers, so a few points of rounding are expected.
const tolerance = { share: 0.01, minimum: 3 };

test("the measurements are for the site's current patch", () => {
  const anyMeasured = practiceCases.some((c) => c.measured.length > 0);
  if (anyMeasured) expect(measuredOnPatch, "Patch changed: redo the Practice Tool tests").toBe(PATCH);
});

test("every case's dummy has enough HP (its damage counter stops at max HP − 1)", () => {
  for (const c of practiceCases) {
    expect(expectedDamage(c), `case ${c.id}`).toBeLessThan(c.dummy.hp * practiceDummy.safeShareOfHp);
    expect(c.dummy.hp % practiceDummy.hpStep, `case ${c.id}: HP must be reachable in steps of 100`).toBe(0);
    expect(c.dummy.resist % practiceDummy.resistStep, `case ${c.id}: resist in steps of 10`).toBe(0);
  }
});

for (const c of practiceCases) {
  test.skipIf(c.measured.length === 0)(`Practice Tool case ${c.id}: ${c.checks}`, () => {
    const expected = expectedDamage(c);
    const average = c.measured.reduce((a, b) => a + b, 0) / c.measured.length;
    const allowed = Math.max(expected * tolerance.share, tolerance.minimum);
    expect(Math.abs(average - expected), `measured ${average.toFixed(1)}, calculator ${expected.toFixed(1)}`).toBeLessThanOrEqual(allowed);
  });
}
