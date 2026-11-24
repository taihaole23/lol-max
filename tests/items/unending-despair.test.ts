import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { run, runAbility } from "./helpers.ts";
import type { DamageEvent } from "../../src/simulation/simulate.ts";

const saps = (events: DamageEvent[]) => events.filter((e) => e.source === "Unending Despair");

test("Akali R: one sap at 4 s (inside the 5.5 s window), 3% bonus HP magic damage", () => {
  const events = runAbility("akali", "r", ["Unending Despair"]).events;
  const stats = championStats("akali", 18, [getItem("Unending Despair")]);
  const found = saps(events);
  expect(found).toHaveLength(1);
  expect(found[0].time).toBe(4);
  expect(found[0].type).toBe("magic");
  expect(found[0].amount).toBeCloseTo(0.03 * (stats.health - stats.baseHealth));
});

test("never inside Katarina's 2.5 s ult or a one-hit ability's 3 s window", () => {
  expect(saps(run(16, ["Unending Despair"]).events)).toHaveLength(0);
  expect(saps(runAbility("akali", "q", ["Unending Despair"]).events)).toHaveLength(0);
  expect(saps(runAbility("akali", "e", ["Unending Despair"]).events)).toHaveLength(0);
});
