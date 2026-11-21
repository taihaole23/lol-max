// Checks the item snapshot: right patch, right items in and out, no duplicates.
import { test, expect } from "vitest";
import { items, itemSource, getItem } from "../src/data/items.ts";
import { dummyPresets } from "../src/data/dummy-presets.ts";
import { PATCH } from "../src/data/patch.ts";

const names = items.map((i) => i.name);

test("the snapshot is for the site's patch", () => {
  expect(itemSource.patch).toBe(PATCH);
  expect(itemSource.url).toContain("ddragon.leagueoflegends.com");
});

test("every recommended dummy item exists", () => {
  for (const preset of Object.values(dummyPresets)) {
    for (const name of [preset.boots, ...preset.itemsInBuyOrder]) {
      expect(names).toContain(name);
    }
  }
});

test("each item name appears only once", () => {
  expect(new Set(names).size).toBe(names.length);
});

test("items that are in the game are in", () => {
  expect(getItem("Blade of The Ruined King").category).toBe("legendary");
  expect(getItem("Stormsurge").category).toBe("legendary");
  expect(getItem("Mejai's Soulstealer").category).toBe("legendary"); // confirmed by Eric
  expect(getItem("Gunmetal Greaves").category).toBe("boots-tier-3");
  expect(getItem("Dream Maker").category).toBe("support");
});

test("items that aren't legendaries or boots on Summoner's Rift are out", () => {
  // Zephyr and Rite of Ruin: other game modes. Long Sword: a component. Boots: tier 1.
  for (const name of ["Zephyr", "Rite of Ruin", "Long Sword", "Boots"]) {
    expect(names).not.toContain(name);
  }
});

test("7 tier-2 boots and 7 tier-3 boots", () => {
  expect(items.filter((i) => i.category === "boots")).toHaveLength(7);
  expect(items.filter((i) => i.category === "boots-tier-3")).toHaveLength(7);
});

test("penetration and lethality are read from the descriptions", () => {
  // Data Dragon's `stats` field leaves these out, so they prove the script reads the description.
  expect(getItem("Void Staff").stats.percentMagicPenetration).toBe(0.4);
  expect(getItem("Youmuu's Ghostblade").stats.lethality).toBe(18);
  expect(getItem("Sorcerer's Shoes").stats.flatMagicPenetration).toBe(12);
});

test("getItem throws on a misspelled name", () => {
  expect(() => getItem("Thornmial")).toThrow();
});
