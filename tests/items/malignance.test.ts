import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { katarinaStats } from "../../src/stats/katarina-stats.ts";
import { run, easyDummy } from "./helpers.ts";

const mrDummy = { ...easyDummy, baseMagicResist: 100 };

// Every test uses a 100 MR dummy. (On a 0 MR dummy, -10 MR makes it -10, which
// raises damage too, so "0 MR" numbers aren't the damage before MR.)
function ticks() {
  return run(16, ["Malignance"], mrDummy).events.filter((e) => e.source === "Malignance");
}

test("10 ticks land inside the channel: every 0.25 s from 0.25 s to 2.5 s", () => {
  const times = ticks().map((e) => e.time);
  expect(times).toHaveLength(10);
  times.forEach((time, i) => expect(time).toBeCloseTo(0.25 * (i + 1)));
});

test("each tick: (60 + 5% AP) / 4 magic damage, with the dummy at 90 MR", () => {
  const ap = katarinaStats(16, [getItem("Malignance")]).ap;
  for (const tick of ticks()) {
    expect(tick.type).toBe("magic");
    expect(tick.amount).toBeCloseTo(((60 + 0.05 * ap) / 4) * (100 / 190));
  }
});

test("-10 MR, but not for the first dagger (wiki)", () => {
  // Every dagger's base damage is the same before MR, so only MR makes them differ.
  const hits = run(16, ["Malignance"], mrDummy).events.filter((e) => e.source === "base");
  expect(hits[1].amount / hits[0].amount).toBeCloseTo(200 / 190); // dagger 1 at 100 MR, dagger 2 at 90
  expect(hits[14].amount).toBeCloseTo(hits[1].amount);
});

test("every simulation makes its own zone", () => {
  ticks();
  expect(ticks()).toHaveLength(10);
});
