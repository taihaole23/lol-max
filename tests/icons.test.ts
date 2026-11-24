// Every icon the site can show must exist in public/icons/ (saved by scripts/update-icons.mjs).
import { test, expect } from "vitest";
import { championList, championListSource } from "../src/data/champion-list.ts";
import { champions } from "../src/data/champions.ts";
import { items } from "../src/data/items.ts";
import { PATCH } from "../src/data/patch.ts";
import { playableChampions } from "../src/data/playable-champions.ts";
import { iconPath } from "../src/ui/icons.ts";

// `import.meta.glob` is a Vite feature: it lists every file matching the pattern (without loading
// them). Its keys look like "/public/icons/item/3089.png".
const iconFiles = new Set(Object.keys(import.meta.glob(["/public/icons/**/*.png", "/public/icons/**/*.jpg"])));
const exists = (path: string) => iconFiles.has(`/public${path}`);

test("the champion list is for the site's patch, and slugs are unique", () => {
  expect(championListSource.patch).toBe(PATCH);
  expect(championList.length).toBeGreaterThan(150);
  expect(new Set(championList.map((c) => c.slug)).size).toBe(championList.length);
});

test("every champion in the search list has an icon and 4 ability icons", () => {
  for (const c of championList) {
    expect(exists(iconPath.champion(c.slug)), c.name).toBe(true);
    for (const key of ["q", "w", "e", "r"] as const) expect(exists(iconPath.ability(c.slug, key)), `${c.name} ${key}`).toBe(true);
  }
});

test("every playable champion has splash art (update-icons.mjs's splashChampions list)", () => {
  for (const slug of Object.keys(playableChampions)) expect(exists(iconPath.splash(slug)), slug).toBe(true);
});

test("every item in the item snapshot has an icon", () => {
  for (const item of items) expect(exists(iconPath.item(item)), item.name).toBe(true);
});

test("the champions the site uses (playable ones and dummies) are in the champion list", () => {
  const slugs = championList.map((c) => c.slug);
  for (const slug of [...Object.keys(playableChampions), ...Object.keys(champions)]) expect(slugs, slug).toContain(slug);
});
