// Checks the item group data and the "can these two be built together?" rule.
import { test, expect } from "vitest";
import { itemGroups, meleeCannotBuy } from "../src/data/item-groups.ts";
import { getItem } from "../src/data/items.ts";
import { PATCH } from "../src/data/patch.ts";
import { playableChampions, rangeOf, type PlayableChampionId } from "../src/data/playable-champions.ts";
import { legendaryPool } from "../src/optimizer/item-pool.ts";
import { canBeBuiltTogether } from "../src/optimizer/legal.ts";

test("the group data is for the site's patch", () => {
  expect(itemGroups.source.patch).toBe(PATCH);
  expect(meleeCannotBuy.source.patch).toBe(PATCH);
});

test("every item in a group exists in the snapshot", () => {
  for (const members of Object.values(itemGroups.groups)) {
    for (const name of members) getItem(name); // throws on a typo
  }
  for (const name of meleeCannotBuy.items) getItem(name);
});

// Ranged-only items (Runaan's Hurricane) are in the pool for ranged champions only.
test("ranged-only items are buyable by ranged champions only", () => {
  for (const id of Object.keys(playableChampions) as PlayableChampionId[]) {
    const names = legendaryPool(false, [], id).legendaries.map((i) => i.name);
    for (const name of meleeCannotBuy.items) expect(names.includes(name), `${id}: ${name}`).toBe(rangeOf(id).ranged);
  }
  expect(legendaryPool(false).legendaries.map((i) => i.name)).not.toContain("Runaan's Hurricane"); // no champion = melee
});

test("no item is listed twice in the same group", () => {
  for (const members of Object.values(itemGroups.groups)) {
    expect(new Set(members).size).toBe(members.length);
  }
});

test("items in the same group can't be built together", () => {
  expect(canBeBuiltTogether("Void Staff", "Terminus")).toBe(false); // Blight (caught by Eric)
  expect(canBeBuiltTogether("Black Cleaver", "Terminus")).toBe(false); // Fatality
  expect(canBeBuiltTogether("Lich Bane", "Trinity Force")).toBe(false); // Spellblade
  expect(canBeBuiltTogether("Archangel's Staff", "Sterak's Gage")).toBe(false); // Lifeline
});

test("the order of the two items doesn't matter", () => {
  expect(canBeBuiltTogether("Terminus", "Void Staff")).toBe(false);
});

test("an item can't be built twice", () => {
  expect(canBeBuiltTogether("Rabadon's Deathcap", "Rabadon's Deathcap")).toBe(false);
});

test("items in different groups, or none, can be built together", () => {
  expect(canBeBuiltTogether("Rabadon's Deathcap", "Void Staff")).toBe(true);
  expect(canBeBuiltTogether("Void Staff", "Black Cleaver")).toBe(true); // Blight + Fatality: different groups
  // Same passive name ("Energized"), but no shared group: the real shop allows it.
  expect(canBeBuiltTogether("Rapid Firecannon", "Statikk Shiv")).toBe(true);
});
