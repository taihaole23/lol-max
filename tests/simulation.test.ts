// Tests for the dagger-by-dagger simulation. Real items come in Step 5, so these
// tests use small fake items that exist only here.
import { test, expect } from "vitest";
import { simulateDeathLotus, type Attacker, type Target, type ItemEffect } from "../src/simulation/simulate.ts";
import { breakdown } from "../src/simulation/breakdown.ts";
import { hpAfterHit } from "../src/simulation/hp.ts";
import { fullChannelRawDamage } from "../src/formulas/death-lotus.ts";
import { noShred } from "../src/formulas/resistance.ts";

const attacker: Attacker = {
  ap: 200,
  bonusAd: 100,
  baseAd: 60,
  health: 1000,
  critChance: 0,
  bonusAttackSpeed: 0,
  armorShred: noShred,
  magicShred: noShred,
};

// 100 armor and 50 MR: physical damage × 0.5, magic damage × 100/150.
const target: Target = {
  hp: 100_000,
  bonusHp: 0,
  baseArmor: 100,
  bonusArmor: 0,
  baseMagicResist: 50,
  bonusMagicResist: 0,
};

test("hpAfterHit never goes below 1", () => {
  expect(hpAfterHit(500, 200)).toBe(300);
  expect(hpAfterHit(100, 200)).toBe(1);
  expect(hpAfterHit(1, 50)).toBe(1);
});

test("15 daggers, 0.166 s apart, starting at 0 s", () => {
  const { events } = simulateDeathLotus({ rank: 1, attacker, target, items: [] });
  const daggerTimes = events.filter((e) => e.source === "base").map((e) => e.time);
  expect(daggerTimes).toHaveLength(15);
  expect(daggerTimes[0]).toBe(0);
  expect(daggerTimes[14]).toBeCloseTo(14 * 0.166);
});

test("with no items, the simulation matches Step 3's full-channel formula after armor/MR", () => {
  const { events } = simulateDeathLotus({ rank: 3, attacker, target, items: [] });
  const raw = fullChannelRawDamage(3, attacker.ap, attacker.bonusAd, attacker.bonusAttackSpeed);
  const result = breakdown(events);
  expect(result.byType.magic).toBeCloseTo(raw.magic * (100 / 150));
  expect(result.byType.physical).toBeCloseTo(raw.physical * 0.5);
});

test("overkill rule: a 100 HP target ends at 1 HP but every hit still counts in full", () => {
  const tiny = simulateDeathLotus({ rank: 3, attacker, target: { ...target, hp: 100 }, items: [] });
  const huge = simulateDeathLotus({ rank: 3, attacker, target, items: [] });
  expect(tiny.targetHpAtEnd).toBe(1);
  expect(breakdown(tiny.events).total).toBeCloseTo(breakdown(huge.events).total);
});

test("channel window: a 4 s burn only counts the ticks inside the 2.5 s channel", () => {
  // Fake item: the first dagger starts a burn that deals 10 true damage every 0.5 s for 4 s.
  let started = false;
  const burn: ItemEffect = {
    name: "Fake Burn",
    onHit: (context) => {
      if (started) return;
      started = true;
      for (let tick = 1; tick <= 8; tick++) {
        context.schedule(tick * 0.5, (later) => later.dealDamage(10, "true"));
      }
    },
  };
  const { events } = simulateDeathLotus({ rank: 1, attacker, target, items: [burn] });
  const ticks = events.filter((e) => e.source === "Fake Burn");
  // Ticks at 0.5, 1.0, 1.5, 2.0 and 2.5 s. A tick exactly at the end still counts.
  expect(ticks.map((e) => e.time)).toEqual([0.5, 1, 1.5, 2, 2.5]);
});

test("on-hit damage is scaled by the R rank's effectiveness (25 / 30 / 35%)", () => {
  // Fake item: 100 true damage on-hit.
  const onHit: ItemEffect = {
    name: "Fake On-Hit",
    onHit: (context) => context.dealDamage(100 * context.onHitEffectiveness, "true"),
  };
  for (const [rank, effectiveness] of [[1, 0.25], [2, 0.3], [3, 0.35]] as const) {
    const { events } = simulateDeathLotus({ rank, attacker, target, items: [onHit] });
    expect(breakdown(events).bySource["Fake On-Hit"]).toBeCloseTo(15 * 100 * effectiveness);
  }
});

test("attack speed gained mid-ult makes later daggers' physical damage bigger", () => {
  // Fake item: every dagger gives +10% bonus attack speed, AFTER that dagger hits.
  const stacking: ItemEffect = {
    name: "Fake Stacks",
    onHit: (context) => {
      context.attacker.bonusAttackSpeed += 0.1;
    },
  };
  const { events } = simulateDeathLotus({ rank: 1, attacker, target, items: [stacking] });
  const physical = events.filter((e) => e.type === "physical");
  // First dagger: 0 stacks. Last dagger: 14 stacks = +140% bonus attack speed.
  // (16% + 50% × 1.4) × 100 bonus AD × 0.5 from armor
  expect(physical[0].amount).toBeCloseTo(0.16 * 100 * 0.5);
  expect(physical[14].amount).toBeCloseTo((0.16 + 0.5 * 1.4) * 100 * 0.5);
  // The caller's attacker is not changed by the simulation.
  expect(attacker.bonusAttackSpeed).toBe(0);
});

test("all breakdown views add up to the same total", () => {
  const onHit: ItemEffect = {
    name: "Fake On-Hit",
    onHit: (context) => context.dealDamage(50 * context.onHitEffectiveness, "magic"),
  };
  const result = breakdown(simulateDeathLotus({ rank: 2, attacker, target, items: [onHit] }).events);
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  expect(sum(Object.values(result.bySource))).toBeCloseTo(result.total);
  expect(result.byType.magic + result.byType.physical + result.byType.true).toBeCloseTo(result.total);
  expect(result.ability + result.items).toBeCloseTo(result.total);
});
