// Checks a few items in our snapshot (from Riot's Data Dragon) against the wiki,
// an independent source. Each item tests a different risk; see the comments.
// Wiki values read on patch 26.23 from https://wiki.leagueoflegends.com/en-us/<Item_name>
import { test, expect } from "vitest";
import { getItem } from "../src/data/items.ts";

const wiki = [
  // % magic pen: missing from Data Dragon's `stats` field.
  { name: "Void Staff", gold: 3000, stats: { abilityPower: 95, percentMagicPenetration: 0.4 } },
  // Lethality: missing from Data Dragon's `stats` field.
  { name: "Youmuu's Ghostblade", gold: 2800, stats: { attackDamage: 55, lethality: 18, percentMoveSpeed: 0.04 } },
  // Flat magic pen, and a boots item.
  { name: "Sorcerer's Shoes", gold: 1100, stats: { flatMagicPenetration: 12, moveSpeed: 45 } },
  // Meraki said 40 AD; Data Dragon and the wiki say 45.
  { name: "Black Cleaver", gold: 3000, stats: { attackDamage: 45, abilityHaste: 20, health: 400 } },
  // Data Dragon has two Thornmails; this checks we kept the right one.
  { name: "Thornmail", gold: 2450, stats: { armor: 75, health: 150 } },
  // Attack speed stored as a fraction (25% → 0.25).
  { name: "Guinsoo's Rageblade", gold: 3000, stats: { attackDamage: 30, abilityPower: 30, attackSpeed: 0.25 } },
];

for (const expected of wiki) {
  test(`${expected.name} matches the wiki`, () => {
    const item = getItem(expected.name);
    expect(item.gold).toBe(expected.gold);
    // toEqual compares every stat, so a stat that's missing or extra also fails.
    expect(item.stats).toEqual(expected.stats);
  });
}
