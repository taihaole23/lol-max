import { test, expect } from "vitest";
import { easyDummy, run } from "./helpers.ts";

test("procs once, on dagger 2, for 8% of the dummy's max HP as physical damage", () => {
  const times = run(16, []).events.filter((e) => e.source === "base").map((e) => e.time);
  const hits = run(16, ["Eclipse"]).events.filter((e) => e.source === "Eclipse");
  expect(hits).toHaveLength(1);
  expect(hits[0].time).toBe(times[1]);
  expect(hits[0].type).toBe("physical");
  expect(hits[0].amount).toBeCloseTo(0.08 * easyDummy.hp);
});

test("reads MAX HP: on a 2000 HP dummy it's 160 even though the dummy has taken damage", () => {
  const hits = run(16, ["Eclipse"], { ...easyDummy, hp: 2000 }).events.filter((e) => e.source === "Eclipse");
  expect(hits[0].amount).toBeCloseTo(160);
});
