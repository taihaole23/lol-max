import { test, expect } from "vitest";
import { stages } from "../../src/data/stages.ts";
import { itemGroups } from "../../src/data/item-groups.ts";
import { bootsPool, legendaryPool } from "../../src/optimizer/item-pool.ts";
import { findTopBuilds } from "../../src/optimizer/search.ts";
import { simulateBuild } from "../../src/simulation/simulate-build.ts";
import { presetDummy } from "./helpers.ts";

test("Early: the best build is the best of every legendary × every boots, worked out by hand", () => {
  const target = presetDummy("tank", "early");
  let best = 0;
  for (const item of legendaryPool().legendaries) {
    for (const boots of bootsPool("tier2")) {
      const damage = simulateBuild(6, [item, boots], target).events.reduce((sum, e) => sum + e.amount, 0);
      best = Math.max(best, damage);
    }
  }
  const top = findTopBuilds({ stage: "early", target, boots: "tier2" });
  expect(top[0].damage).toBeCloseTo(best);
});

test("returns 5 builds, best first", () => {
  const top = findTopBuilds({ stage: "mid", target: presetDummy("bruiser", "mid"), boots: "tier2" });
  expect(top).toHaveLength(5);
  for (let i = 1; i < top.length; i++) expect(top[i - 1].damage).toBeGreaterThanOrEqual(top[i].damage);
});

test("slot counts and boots follow the stage and the toggles", () => {
  const legendaries = (build: { items: { category: string }[] }) => build.items.filter((i) => i.category === "legendary");
  const target = presetDummy("squishy", "late");

  for (const build of findTopBuilds({ stage: "late", target, boots: "tier2" })) {
    expect(legendaries(build)).toHaveLength(stages.late.itemsWithBoots);
    expect(build.items.filter((i) => i.category === "boots")).toHaveLength(1);
  }
  for (const build of findTopBuilds({ stage: "late", target, boots: "tier3" })) {
    expect(build.items.filter((i) => i.category === "boots-tier-3")).toHaveLength(1);
  }
  for (const build of findTopBuilds({ stage: "mid", target, boots: "off" })) {
    expect(build.items).toHaveLength(stages.mid.itemsWithoutBoots);
  }
});

test("Full: 5 items + boots with boots on, 6 items with boots off, never more than 6 slots", () => {
  const target = presetDummy("tank", "full");
  for (const build of findTopBuilds({ stage: "full", target, boots: "tier2" })) expect(build.items).toHaveLength(6);
  for (const build of findTopBuilds({ stage: "full", target, boots: "off" })) {
    expect(build.items).toHaveLength(6);
    expect(build.items.every((i) => i.category === "legendary")).toBe(true);
  }
}, 60_000);

test("no build has two items from the same item group, or the same item twice", () => {
  const target = presetDummy("tank", "late");
  for (const build of findTopBuilds({ stage: "late", target, boots: "tier2" })) {
    const names = build.items.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
    for (const members of Object.values(itemGroups.groups)) {
      expect(names.filter((n) => members.includes(n)).length).toBeLessThanOrEqual(1);
    }
  }
});

test("progress goes up to 1", () => {
  const fractions: number[] = [];
  findTopBuilds({ stage: "mid", target: presetDummy("tank", "mid"), boots: "tier2", onProgress: (f) => fractions.push(f) });
  expect(fractions.at(-1)).toBe(1);
  for (let i = 1; i < fractions.length; i++) expect(fractions[i]).toBeGreaterThanOrEqual(fractions[i - 1]);
});
