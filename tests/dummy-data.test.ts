// Checks the champion and dummy preset data for typos and missing pieces.
import { test, expect } from "vitest";
import { champions } from "../src/data/champions.ts";
import { dummyPresets } from "../src/data/dummy-presets.ts";
import { stages } from "../src/data/stages.ts";
import { PATCH } from "../src/data/patch.ts";

test("every champion cites the wiki and the site's patch", () => {
  for (const champion of Object.values(champions)) {
    expect(champion.source.url).toContain("wiki.leagueoflegends.com");
    expect(champion.source.patch).toBe(PATCH);
  }
});

test("every preset has enough items for the Full stage", () => {
  for (const preset of Object.values(dummyPresets)) {
    expect(preset.itemsInBuyOrder).toHaveLength(stages.full.itemsWithBoots);
  }
});

test("no preset lists the same item twice", () => {
  for (const preset of Object.values(dummyPresets)) {
    expect(new Set(preset.itemsInBuyOrder).size).toBe(preset.itemsInBuyOrder.length);
  }
});

test("the enemy types use Nami, Illaoi and Sion", () => {
  expect(dummyPresets.squishy.champion).toBe("nami");
  expect(dummyPresets.bruiser.champion).toBe("illaoi");
  expect(dummyPresets.tank.champion).toBe("sion");
});
