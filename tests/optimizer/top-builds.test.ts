import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import { keepTop, type FoundBuild } from "../../src/optimizer/top-builds.ts";

const build = (name: string, damage: number, gold = 3000): FoundBuild => ({ items: [getItem(name)], damage, gold });

test("keeps the best N, best first", () => {
  const top: FoundBuild[] = [];
  for (const [name, damage] of [
    ["Rabadon's Deathcap", 500],
    ["Nashor's Tooth", 900],
    ["Riftmaker", 100],
    ["Lich Bane", 700],
  ] as const) {
    keepTop(top, build(name, damage), 3);
  }
  expect(top.map((b) => b.damage)).toEqual([900, 700, 500]);
});

test("a build worse than a full list is ignored", () => {
  const top = [build("Riftmaker", 900), build("Lich Bane", 800)];
  keepTop(top, build("Rabadon's Deathcap", 100), 2);
  expect(top.map((b) => b.damage)).toEqual([900, 800]);
});

test("on equal damage, the cheaper build ranks first", () => {
  const top: FoundBuild[] = [];
  keepTop(top, build("Riftmaker", 500, 3100), 5);
  keepTop(top, build("Lich Bane", 500, 2900), 5);
  expect(top[0].gold).toBe(2900);
});

test("on equal damage and gold, alphabetical order, whatever order they arrive in", () => {
  const a: FoundBuild[] = [];
  keepTop(a, build("Riftmaker", 500), 5);
  keepTop(a, build("Lich Bane", 500), 5);
  const b: FoundBuild[] = [];
  keepTop(b, build("Lich Bane", 500), 5);
  keepTop(b, build("Riftmaker", 500), 5);
  expect(a.map((x) => x.items[0].name)).toEqual(["Lich Bane", "Riftmaker"]);
  expect(b.map((x) => x.items[0].name)).toEqual(["Lich Bane", "Riftmaker"]);
});
