// Checks the Katarina data file for typos. These are not formula tests (those come in Step 3).
import { test, expect } from "vitest";
import { katarina } from "../src/data/katarina.ts";
import { PATCH } from "../src/data/patch.ts";

const r = katarina.deathLotus;

test("every per-rank list has exactly 3 entries", () => {
  expect(r.magicBaseDamage).toHaveLength(3);
  expect(r.onHitEffectiveness).toHaveLength(3);
});

test("on-hit effectiveness is 25 / 30 / 35% by R rank", () => {
  expect(r.onHitEffectiveness).toEqual([0.25, 0.3, 0.35]);
});

test("15 daggers add up to the wiki's maximum damage", () => {
  // Wiki "Maximum Magic Damage": 375 / 562.5 / 750 (+ 285% AP)
  expect(r.magicBaseDamage.map((d) => d * r.daggersPerTarget)).toEqual([375, 562.5, 750]);
  expect(r.magicApRatio * r.daggersPerTarget).toBeCloseTo(2.85);
  // Wiki "Maximum Physical Damage": 240% (+ 750% per 100% bonus attack speed) bonus AD
  expect(r.physicalBonusAdRatio * r.daggersPerTarget).toBeCloseTo(2.4);
  expect(r.physicalBonusAdRatioPerBonusAttackSpeed * r.daggersPerTarget).toBeCloseTo(7.5);
});

test("every group cites the wiki and the site's patch", () => {
  for (const group of [katarina.baseStats, katarina.deathLotus]) {
    expect(group.source.url).toContain("wiki.leagueoflegends.com");
    expect(group.source.patch).toBe(PATCH);
  }
});
