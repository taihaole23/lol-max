import { test, expect } from "vitest";
import { itemGroups } from "../../src/data/item-groups.ts";
import { bootsPool, legendaryPool } from "../../src/optimizer/item-pool.ts";
import { findTopBuilds } from "../../src/optimizer/search.ts";
import { stagePreset } from "../../src/optimizer/setup.ts";
import { simulateBuild } from "../../src/simulation/simulate-build.ts";
import { presetDummy, presetInput } from "./helpers.ts";

const legendaries = (build: { items: { category: string }[] }) => build.items.filter((i) => i.category === "legendary");

test("Early: the best build is the best of every legendary × every boots, worked out by hand", () => {
  const target = presetDummy("tank", "early");
  let best = 0;
  for (const item of legendaryPool().legendaries) {
    for (const boots of bootsPool("tier2")) {
      const damage = simulateBuild(6, [item, boots], target).events.reduce((sum, e) => sum + e.amount, 0);
      best = Math.max(best, damage);
    }
  }
  const top = findTopBuilds(presetInput("tank", "early"));
  expect(top[0].damage).toBeCloseTo(best);
});

test("returns 5 builds, best first", () => {
  const top = findTopBuilds(presetInput("bruiser", "mid"));
  expect(top).toHaveLength(5);
  for (let i = 1; i < top.length; i++) expect(top[i - 1].damage).toBeGreaterThanOrEqual(top[i].damage);
});

test("stage presets: level, highest R rank and item count", () => {
  expect(stagePreset("early", "tier2")).toEqual({ level: 6, rRank: 1, itemCount: 1 });
  expect(stagePreset("mid", "off")).toEqual({ level: 11, rRank: 2, itemCount: 2 });
  expect(stagePreset("full", "tier2")).toEqual({ level: 18, rRank: 3, itemCount: 5 });
  expect(stagePreset("full", "off")).toEqual({ level: 18, rRank: 3, itemCount: 6 });
});

test("slot counts and boots follow the item count and the toggles", () => {
  const target = presetDummy("squishy", "late");
  const late = stagePreset("late", "tier2");

  for (const build of findTopBuilds({ ...late, target, boots: "tier2" })) {
    expect(legendaries(build)).toHaveLength(late.itemCount);
    expect(build.items.filter((i) => i.category === "boots")).toHaveLength(1);
  }
  for (const build of findTopBuilds({ ...late, target, boots: "tier3" })) {
    expect(build.items.filter((i) => i.category === "boots-tier-3")).toHaveLength(1);
  }
  for (const build of findTopBuilds({ ...stagePreset("mid", "off"), target, boots: "off" })) {
    expect(build.items).toHaveLength(2);
  }
});

test("a custom item count (the +/- slot buttons): 4 items at level 13", () => {
  const target = presetDummy("tank", "late");
  for (const build of findTopBuilds({ level: 13, rRank: 2, itemCount: 4, target, boots: "tier2" })) {
    expect(legendaries(build)).toHaveLength(4);
  }
});

test("Full: 5 items + boots with boots on, 6 items with boots off, never more than 6 slots", () => {
  const target = presetDummy("tank", "full");
  for (const build of findTopBuilds(presetInput("tank", "full"))) expect(build.items).toHaveLength(6);
  for (const build of findTopBuilds({ ...stagePreset("full", "off"), target, boots: "off" })) {
    expect(build.items).toHaveLength(6);
    expect(build.items.every((i) => i.category === "legendary")).toBe(true);
  }
}, 60_000);

test("a lower R rank deals less damage (level 16, 1 item + boots)", () => {
  const input = { ...presetInput("tank", "late"), itemCount: 1 }; // level 16 → rank 3 by default
  const rank3 = findTopBuilds(input);
  const rank1 = findTopBuilds({ ...input, rRank: 1 });
  expect(rank1[0].damage).toBeLessThan(rank3[0].damage);
});

test("impossible setups are refused", () => {
  const input = presetInput("tank", "early");
  expect(() => findTopBuilds({ ...input, rRank: 2 })).toThrow(); // rank 2 needs level 11
  expect(() => findTopBuilds({ ...input, level: 10, rRank: 2 })).toThrow(); // level 10 is still rank 1
  expect(() => findTopBuilds({ ...input, level: 5 })).toThrow(); // no R before level 6
  expect(() => findTopBuilds({ ...input, level: 19 })).toThrow();
  expect(() => findTopBuilds({ ...input, itemCount: 0 })).toThrow();
  expect(() => findTopBuilds({ ...input, itemCount: 6 })).toThrow(); // 6 items + boots = 7 slots
});

test("no build has two items from the same item group, or the same item twice", () => {
  for (const build of findTopBuilds(presetInput("tank", "late"))) {
    const names = build.items.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
    for (const members of Object.values(itemGroups.groups)) {
      expect(names.filter((n) => members.includes(n)).length).toBeLessThanOrEqual(1);
    }
  }
});

test("progress goes up to 1", () => {
  const fractions: number[] = [];
  findTopBuilds({ ...presetInput("tank", "mid"), onProgress: (f) => fractions.push(f) });
  expect(fractions.at(-1)).toBe(1);
  for (let i = 1; i < fractions.length; i++) expect(fractions[i]).toBeGreaterThanOrEqual(fractions[i - 1]);
});
