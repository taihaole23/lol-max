import { test, expect } from "vitest";
import { easyDummy, run, runAbility } from "./helpers.ts";

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

// "Up to one stack per cast instance", 2 stacks within 2 s. (Each hit's pieces share one stack.)
test("Akali E: the first cast and the recast are 2 casts, so the recast procs it at 0 s", () => {
  const hits = runAbility("akali", "e", ["Eclipse"]).events.filter((e) => e.source === "Eclipse");
  expect(hits).toHaveLength(1);
  expect(hits[0].time).toBe(0);
  expect(hits[0].amount).toBeCloseTo(0.08 * easyDummy.hp);
});

test("Akali R: R1 and R2 are 2.5 s apart (more than 2 s), so it never procs", () => {
  expect(runAbility("akali", "r", ["Eclipse"]).events.filter((e) => e.source === "Eclipse")).toHaveLength(0);
});

test("one-hit abilities (Akali's Q, Katarina's E) never proc it", () => {
  expect(runAbility("akali", "q", ["Eclipse"]).events.filter((e) => e.source === "Eclipse")).toHaveLength(0);
  expect(runAbility("katarina", "e", ["Eclipse"]).events.filter((e) => e.source === "Eclipse")).toHaveLength(0);
});
