import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { run } from "./helpers.ts";

test("1% of Katarina's max health per dagger (her own 600 from the item included)", () => {
  const health = championStats("katarina", 16, [getItem("Titanic Hydra")]).health;
  const damage = run(16, ["Titanic Hydra"]).breakdown.bySource["Titanic Hydra"];
  expect(damage).toBeCloseTo(0.01 * health * 0.35 * 15);
});

test("it's physical damage", () => {
  const events = run(16, ["Titanic Hydra"]).events.filter((e) => e.source === "Titanic Hydra");
  expect(events.every((e) => e.type === "physical")).toBe(true);
});
