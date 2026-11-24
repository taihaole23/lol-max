// Checks the item group data and the "can these two be built together?" rule.
import { test, expect } from "vitest";
import { itemGroups, meleeCannotBuy } from "../src/data/item-groups.ts";
import { getItem } from "../src/data/items.ts";
import { PATCH } from "../src/data/patch.ts";
import { playableChampions } from "../src/data/playable-champions.ts";
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

// The item pool leaves out ranged-only items for everyone, which is only right if every playable
// champion is melee. A ranged champion would need the pool to depend on the champion.
test("every playable champion is melee", () => {
  for (const champion of Object.values(playableChampions)) expect(champion.rangeType.type, champion.name).toBe("melee");
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
