import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { championStats } from "../../src/stats/champion-stats.ts";
import { daggerPhysicalDamage } from "../../src/formulas/death-lotus.ts";
import { damageMultiplier } from "../../src/formulas/resistance.ts";
import { easyDummy, run } from "./helpers.ts";

test("fires once, before R's first damage, for 8% of the dummy's current HP (not shrunk)", () => {
  const events = run(16, ["Voltaic Cyclosword"]).events;
  const hits = events.filter((e) => e.source === "Voltaic Cyclosword");
  expect(hits).toHaveLength(1);
  expect(events[0].source).toBe("Voltaic Cyclosword"); // the very first piece of damage
  expect(hits[0].type).toBe("physical");
  expect(hits[0].amount).toBeCloseTo(0.08 * easyDummy.hp);
});

test("+15 lethality for the whole ult, on top of the item's own lethality", () => {
  // 100 armor dummy. Voltaic's own lethality (from its stats) is already in armorShred.
  const armored = { ...easyDummy, baseArmor: 100 };
  const stats = championStats("katarina", 16, [getItem("Voltaic Cyclosword")]);
  const lethality = stats.armorShred.flatPenetration + 15;
  const raw = daggerPhysicalDamage(stats.bonusAd, stats.bonusAttackSpeed);
  const physical = run(16, ["Voltaic Cyclosword"], armored).events.filter((e) => e.source === "bonusAdRatio");
  for (const piece of physical) expect(piece.amount).toBeCloseTo(raw * damageMultiplier(100 - lethality));
});
