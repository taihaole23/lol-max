// The game's rank rules and Katarina's usual skill order (src/stats/ability-ranks.ts).
import { test, expect } from "vitest";
import { checkAbilityRank, maxRankAtLevel, ranksAreLegal, recommendedRanks } from "../src/stats/ability-ranks.ts";

test("basic abilities: rank 1 / 2 / 3 / 4 / 5 at levels 1 / 3 / 5 / 7 / 9", () => {
  expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 18].map((level) => maxRankAtLevel("q", level))).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  expect(maxRankAtLevel("w", 6)).toBe(3);
  expect(maxRankAtLevel("e", 6)).toBe(3);
});

test("R: rank 1 / 2 / 3 at levels 6 / 11 / 16", () => {
  expect([5, 6, 10, 11, 15, 16, 18].map((level) => maxRankAtLevel("r", level))).toEqual([0, 1, 1, 2, 2, 3, 3]);
});

test("level 6 can't have 5 points in Q (Eric's example)", () => {
  expect(ranksAreLegal(6, { q: 5, w: 0, e: 0, r: 1 })).toBe(false); // Q 5 needs level 9
  expect(ranksAreLegal(6, { q: 3, w: 1, e: 1, r: 1 })).toBe(true);
});

test("one skill point per level: ranks can't add up to more than the level", () => {
  expect(ranksAreLegal(6, { q: 3, w: 1, e: 2, r: 1 })).toBe(false); // 7 points at level 6
  expect(ranksAreLegal(6, { q: 2, w: 1, e: 1, r: 1 })).toBe(true); // a point left unspent is fine
});

test("ranks must be whole numbers from 0 up", () => {
  expect(ranksAreLegal(18, { q: -1, w: 5, e: 5, r: 3 })).toBe(false);
  expect(ranksAreLegal(18, { q: 1.5, w: 5, e: 5, r: 3 })).toBe(false);
});

test("the usual skill order: R whenever possible, then max Q, then E, then W", () => {
  expect(recommendedRanks(1)).toEqual({ q: 1, w: 0, e: 0, r: 0 });
  expect(recommendedRanks(3)).toEqual({ q: 1, w: 1, e: 1, r: 0 });
  expect(recommendedRanks(6)).toEqual({ q: 3, w: 1, e: 1, r: 1 });
  expect(recommendedRanks(8)).toEqual({ q: 4, w: 1, e: 2, r: 1 }); // Q 5 must wait for level 9
  expect(recommendedRanks(11)).toEqual({ q: 5, w: 1, e: 3, r: 2 });
  expect(recommendedRanks(16)).toEqual({ q: 5, w: 3, e: 5, r: 3 });
  expect(recommendedRanks(18)).toEqual({ q: 5, w: 5, e: 5, r: 3 });
});

test("the skill order is legal at every level and spends every point", () => {
  for (let level = 1; level <= 18; level++) {
    const ranks = recommendedRanks(level);
    expect(ranksAreLegal(level, ranks), `level ${level}`).toBe(true);
    expect(ranks.q + ranks.w + ranks.e + ranks.r, `level ${level}`).toBe(level);
  }
});

test("checkAbilityRank stops impossible ranks", () => {
  expect(() => checkAbilityRank(6, "q", 3)).not.toThrow();
  expect(() => checkAbilityRank(6, "q", 4)).toThrow();
  expect(() => checkAbilityRank(6, "e", 0)).toThrow(); // rank 0 can't be calculated
  expect(() => checkAbilityRank(5, "r", 1)).toThrow();
});
