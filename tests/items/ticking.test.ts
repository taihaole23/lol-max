// The shared "ticks while it's on" helper (burns, Immolate).
import { test, expect } from "vitest";
import { tickingEffect } from "../../src/items/ticking.ts";
import { simulateDeathLotus } from "../../src/simulation/simulate.ts";
import { easyDummy, fixedAttacker } from "./helpers.ts";

function ticksFor(triggeredBy: (damage: { fromItem: boolean; type: string }) => boolean, durationSeconds: number) {
  let triggers = 0;
  const effect = tickingEffect({
    name: "test",
    secondsBetweenTicks: 0.5,
    durationSeconds,
    triggeredBy: (damage) => triggeredBy(damage) && ++triggers > 0,
    tick: (context) => context.dealDamage(1, "true"),
  });
  const result = simulateDeathLotus({ rank: 3, attacker: fixedAttacker, target: easyDummy, items: [effect] });
  return result.events.filter((e) => e.source === "test").map((e) => e.time);
}

test("refreshed by every dagger: first tick right away, then every 0.5 s for the whole ult", () => {
  expect(ticksFor((d) => !d.fromItem, 3)).toEqual([0, 0.5, 1, 1.5, 2, 2.5]);
});

test("runs out when nothing refreshes it", () => {
  let first = true;
  const onlyFirstHit = () => {
    const result = first;
    first = false;
    return result;
  };
  // Turned on at 0 s for 1 s: ticks at 0, 0.5 and 1.0, then it's off.
  expect(ticksFor(onlyFirstHit, 1)).toEqual([0, 0.5, 1]);
});
