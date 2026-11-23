// The "Sources" section on the site: every link is a real https link to the wiki or Riot, for the current patch.
import { test, expect } from "vitest";
import { PATCH } from "../src/data/patch.ts";
import { sourceGroups } from "../src/data/sources.ts";
import { itemPassives } from "../src/items/index.ts";

const allowedSites = ["https://wiki.leagueoflegends.com/", "https://ddragon.leagueoflegends.com/"];

test("every source links to the wiki or Data Dragon, for the site's patch", () => {
  const all = sourceGroups.flatMap((g) => g.sources);
  expect(all.length).toBeGreaterThan(0);
  for (const s of all) {
    expect(allowedSites.some((site) => s.url.startsWith(site)), s.url).toBe(true);
    expect(s.patch, s.label).toBe(PATCH);
  }
});

test("every hand-coded item passive is listed with its own wiki page", () => {
  const listed = sourceGroups.flatMap((g) => g.sources).map((s) => s.label);
  for (const passive of itemPassives) expect(listed, passive.name).toContain(passive.name);
});
