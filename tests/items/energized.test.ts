// Rapid Firecannon, Stormrazor and Statikk Shiv (they share src/items/energized.ts).
import { test, expect } from "vitest";
import { run } from "./helpers.ts";

const procs = (itemNames: string[], source: string) =>
  run(16, itemNames).events.filter((e) => e.source === source);

test("Rapid Firecannon: dagger 1 only, 40 magic × 0.35 (the bar never refills: 14 × 6 = 84)", () => {
  const hits = procs(["Rapid Firecannon"], "Rapid Firecannon");
  expect(hits).toHaveLength(1);
  expect(hits[0].time).toBe(0);
  expect(hits[0].amount).toBeCloseTo(14);
});

test("Stormrazor: dagger 1 only, 100 magic × 0.35", () => {
  const hits = procs(["Stormrazor"], "Stormrazor");
  expect(hits).toHaveLength(1);
  expect(hits[0].amount).toBeCloseTo(35);
});

test("Statikk Shiv: dagger 1 only, 60 magic NOT shrunk by R's %", () => {
  const hits = procs(["Statikk Shiv"], "Statikk Shiv");
  expect(hits).toHaveLength(1);
  expect(hits[0].amount).toBeCloseTo(60);
});

test("two Energized items both proc on dagger 1", () => {
  expect(procs(["Statikk Shiv", "Stormrazor"], "Statikk Shiv")).toHaveLength(1);
  expect(procs(["Statikk Shiv", "Stormrazor"], "Stormrazor")).toHaveLength(1);
});

test("Guinsoo's Phantom Hits don't refill the bar (they're on-hit, not attacks)", () => {
  expect(procs(["Stormrazor", "Guinsoo's Rageblade"], "Stormrazor")).toHaveLength(1);
});

test("every simulation starts with a full bar", () => {
  run(16, ["Stormrazor"]);
  expect(procs(["Stormrazor"], "Stormrazor")).toHaveLength(1);
});
