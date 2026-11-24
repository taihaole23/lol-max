import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { explainBuild } from "../../src/optimizer/explain.ts";
import { abilityVsItemRows, marginalRows, sourceRows, typeRows, type Row } from "../../src/ui/breakdown-rows.ts";
import { presetDummy } from "../optimizer/helpers.ts";

// A hybrid build, so every kind of row shows up: AP ratio, AD ratio, on-hit, passives, physical and magic.
const items = ["Nashor's Tooth", "Rabadon's Deathcap", "Blade of The Ruined King", "Sorcerer's Shoes"].map(getItem);
const e = explainBuild("katarina", 16, items, presetDummy("bruiser", "late"));
const total = e.breakdown.total;
const sum = (rows: Row[]) => rows.reduce((s, r) => s + r.damage, 0);
const shares = (rows: Row[]) => rows.reduce((s, r) => s + r.share, 0);

test("every breakdown adds up to the build's total, and its shares to 100%", () => {
  for (const rows of [sourceRows(e.breakdown), marginalRows(e), typeRows(e.breakdown), abilityVsItemRows(e.breakdown)]) {
    expect(sum(rows)).toBeCloseTo(total);
    expect(shares(rows)).toBeCloseTo(1);
  }
});

test("by source: the ability's parts first with readable names, then items biggest first", () => {
  const rows = sourceRows(e.breakdown);
  expect(rows.slice(0, 3).map((r) => r.label)).toEqual(["Base damage", "AP ratio", "Bonus AD ratio"]);
  const itemRows = rows.slice(3);
  expect(itemRows.map((r) => r.label)).toContain("Nashor's Tooth"); // on-hit is credited to its item
  for (let i = 1; i < itemRows.length; i++) expect(itemRows[i - 1].damage).toBeGreaterThanOrEqual(itemRows[i].damage);
});

test("marginal: 'No items' first, one row per item, 'Item interactions' last", () => {
  const rows = marginalRows(e);
  expect(rows[0].label).toBe("No items");
  expect(rows.at(-1)!.label).toBe("Item interactions");
  expect(rows).toHaveLength(items.length + 2);
});

test("item rows carry their item (for the icon); the ability's rows and the totals don't", () => {
  const byLabel = new Map(sourceRows(e.breakdown).map((r) => [r.label, r]));
  expect(byLabel.get("Nashor's Tooth")?.item?.name).toBe("Nashor's Tooth");
  expect(byLabel.get("Base damage")?.item).toBeUndefined();
  const marginal = marginalRows(e);
  expect(marginal[0].item).toBeUndefined(); // "No items"
  expect(marginal.at(-1)!.item).toBeUndefined(); // "Item interactions"
  expect(marginal.slice(1, -1).every((r) => r.item?.name === r.label)).toBe(true);
});

test("a build with no item effects: ability = 100%, items = 0%", () => {
  const plain = explainBuild("katarina", 6, [getItem("Rabadon's Deathcap")], presetDummy("tank", "early"));
  const [ability, itemEffects] = abilityVsItemRows(plain.breakdown);
  expect(ability.share).toBeCloseTo(1);
  expect(itemEffects.damage).toBe(0);
});
