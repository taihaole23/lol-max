import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { runSearch } from "../../src/optimizer/run-search.ts";
import { buildStyles, givesStat, styleConstraints } from "../../src/optimizer/styles.ts";
import { presetInput } from "./helpers.ts";

const isBoots = (name: string) => getItem(name).category.startsWith("boots");

test("a style bans every legendary without its stat, and keeps the user's own bans", () => {
  const c = styleConstraints("ap", { required: [], requiredBoots: null, banned: ["Rabadon's Deathcap"] });
  expect(c.banned).toContain("Rabadon's Deathcap"); // the user's ban stays, even though it gives AP
  expect(c.banned).toContain("Kraken Slayer"); // no AP
  expect(c.banned).not.toContain("Nashor's Tooth"); // AP
  expect(c.banned.some(isBoots)).toBe(false); // boots are never touched
});

test("a locked item stays locked even if it doesn't give the style's stat", () => {
  const c = styleConstraints("ap", { required: ["Kraken Slayer"], requiredBoots: null, banned: [] });
  expect(c.banned).not.toContain("Kraken Slayer");
});

test("each style's build: every unlocked legendary gives the stat, and it never beats the overall #1", () => {
  const result = runSearch(presetInput("squishy", "mid"));
  expect(result.styles.map((s) => s.style)).toEqual(buildStyles.map((s) => s.key));
  for (const { style, build } of result.styles) {
    expect(build).not.toBeNull();
    const stat = buildStyles.find((s) => s.key === style)!.stat;
    for (const item of build!.items.filter((i) => !isBoots(i.name))) expect(givesStat(item, stat)).toBe(true);
    expect(build!.damage).toBeLessThanOrEqual(result.builds[0].damage + 1e-9);
    expect(build!.explanation.breakdown.total).toBeCloseTo(build!.damage);
  }
});

test("a locked non-AP item still appears in the AP build", () => {
  const request = { ...presetInput("tank", "mid"), constraints: { required: ["Kraken Slayer"], requiredBoots: null, banned: [] } };
  const ap = runSearch(request).styles.find((s) => s.style === "ap")!.build!;
  expect(ap.items.map((i) => i.name)).toContain("Kraken Slayer");
});
