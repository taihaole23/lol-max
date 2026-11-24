// Compares the calculator with real damage measured in the game's Practice Tool (Step 8).
// Cases and measurements live in practice-tool-cases.ts. A case with no measurement yet, or one a
// patch made out of date (needsRemeasuring), is skipped.
//
// Two kinds of reading:
//   - the dummy's "total damage" COUNTER: compared with expectedCounter (real damage + the counter's
//     known extra physical hit, see src/data/practice-tool.ts);
//   - the dummy's HP BAR after the ult: compared with the real damage. The more reliable one.
import { test, expect } from "vitest";
import { PATCH } from "../src/data/patch.ts";
import { practiceDummy } from "../src/data/practice-tool.ts";
import { expectedCounter, expectedDamage, needsRemeasuring, practiceCases, stillValidOnPatch } from "./practice-tool-cases.ts";

// How close the calculator must be: within 1% (or 3 damage, for small numbers).
// The game shows whole numbers, so a few points of rounding are expected.
const tolerance = { share: 0.01, minimum: 3 };
const allowedGap = (expected: number) => Math.max(expected * tolerance.share, tolerance.minimum);
const average = (list: number[]) => list.reduce((a, b) => a + b, 0) / list.length;

// Not "were they measured on this patch" (that would mean re-measuring every 2 weeks) but "did
// someone check, for this patch, which measurements are still valid?" See practice-tool-cases.ts.
test("the measurements were checked against this patch's changes", () => {
  const anyMeasured = practiceCases.some((c) => c.measured.length > 0 || (c.hpAfter ?? []).length > 0);
  if (anyMeasured) {
    expect(stillValidOnPatch, "New patch: run /patch-day, which decides which Practice Tool cases are still valid").toBe(PATCH);
  }
});

test("every case in needsRemeasuring is a real case, with a reason", () => {
  const ids = new Set(practiceCases.map((c) => c.id));
  for (const [id, reason] of Object.entries(needsRemeasuring)) {
    expect(ids.has(id), `needsRemeasuring has "${id}", which isn't a case`).toBe(true);
    expect(reason.length, `case ${id} needs a reason`).toBeGreaterThan(0);
  }
});

// A case a patch made out of date is skipped (not failed) until it's measured again.
const outdated = (c: { id: string }) => c.id in needsRemeasuring;

test("every case's dummy has enough HP (its counter stops at max HP − 1; its HP bar at 1)", () => {
  for (const c of practiceCases) {
    const hpBarOnly = c.measured.length === 0 && (c.hpAfter ?? []).length > 0;
    if (hpBarOnly) {
      expect(expectedDamage(c), `case ${c.id}`).toBeLessThan(c.dummy.hp * practiceDummy.hpBarSafeShareOfHp);
    } else {
      expect(expectedCounter(c), `case ${c.id}`).toBeLessThan(c.dummy.hp * practiceDummy.safeShareOfHp);
    }
    expect(c.dummy.hp % practiceDummy.hpStep, `case ${c.id}: HP must be reachable in steps of 100`).toBe(0);
    expect(c.dummy.resist % practiceDummy.resistStep, `case ${c.id}: resist in steps of 10`).toBe(0);
  }
});

for (const c of practiceCases) {
  test.skipIf(c.measured.length === 0 || outdated(c))(`Practice Tool case ${c.id} (counter): ${c.checks}`, () => {
    const expected = expectedCounter(c);
    const measured = average(c.measured);
    expect(Math.abs(measured - expected), `counter ${measured.toFixed(1)}, calculator ${expected.toFixed(1)}`).toBeLessThanOrEqual(allowedGap(expected));
  });

  const hpAfter = c.hpAfter ?? [];
  test.skipIf(hpAfter.length === 0 || outdated(c))(`Practice Tool case ${c.id} (HP bar): ${c.checks}`, () => {
    const expected = expectedDamage(c);
    const lost = c.dummy.hp - average(hpAfter);
    expect(Math.abs(lost - expected), `HP lost ${lost.toFixed(1)}, calculator ${expected.toFixed(1)}`).toBeLessThanOrEqual(allowedGap(expected));
  });
}
