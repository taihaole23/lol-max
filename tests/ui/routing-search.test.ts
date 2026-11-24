// The router's address reading and the champion search's matching (no browser needed).
import { test, expect } from "vitest";
import { matchChampions } from "../../src/ui/champion-search.ts";
import { parseRoute, paths } from "../../src/ui/router.ts";

test("addresses → pages", () => {
  expect(parseRoute("/")).toEqual({ page: "home" });
  expect(parseRoute("/about")).toEqual({ page: "about" });
  expect(parseRoute("/katarina")).toEqual({ page: "champion", slug: "katarina", ability: null });
  expect(parseRoute("/katarina/r")).toEqual({ page: "champion", slug: "katarina", ability: "r" });
  expect(parseRoute("/Katarina/R/")).toEqual({ page: "champion", slug: "katarina", ability: "r" }); // case and trailing /
  expect(parseRoute("/ahri")).toEqual({ page: "champion", slug: "ahri", ability: null }); // any real champion
  expect(parseRoute("/notachampion")).toEqual({ page: "notFound" });
  expect(parseRoute("/katarina/x")).toEqual({ page: "notFound" });
  expect(parseRoute("/katarina/r/extra")).toEqual({ page: "notFound" });
});

test("paths and parseRoute agree", () => {
  expect(parseRoute(paths.champion("katarina", "q"))).toEqual({ page: "champion", slug: "katarina", ability: "q" });
  expect(parseRoute(paths.about)).toEqual({ page: "about" });
});

test("search: empty shows every champion, Katarina (playable) first", () => {
  const all = matchChampions("");
  expect(all.length).toBeGreaterThan(150);
  expect(all[0].slug).toBe("katarina");
});

test("search narrows as you type, ignoring case and punctuation", () => {
  expect(matchChampions("kata").map((c) => c.slug)).toEqual(["katarina"]);
  expect(matchChampions("kaisa").map((c) => c.name)).toContain("Kai'Sa");
  expect(matchChampions("KAI'S").map((c) => c.name)).toContain("Kai'Sa");
  expect(matchChampions("zzzz")).toEqual([]);
});

test("search: names that start with the text come before names that only contain it", () => {
  const names = matchChampions("ka").map((c) => c.name);
  const firstContainsOnly = names.findIndex((n) => !n.toLowerCase().startsWith("ka"));
  const lastStartsWith = names.map((n) => n.toLowerCase().startsWith("ka")).lastIndexOf(true);
  expect(firstContainsOnly === -1 || lastStartsWith < firstContainsOnly).toBe(true);
});
