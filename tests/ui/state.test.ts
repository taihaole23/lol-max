// Tests for the page's state functions (src/ui/state.ts) and the helpers they use.
// No browser needed: these functions only take and return plain objects.
import { test, expect } from "vitest";
import { dummyPresets } from "../../src/data/dummy-presets.ts";
import { getItem } from "../../src/data/items.ts";
import { dummyStats, withTypedStats } from "../../src/stats/dummy-stats.ts";
import { allowedRRanks } from "../../src/stats/katarina-stats.ts";
import * as s from "../../src/ui/state.ts";

test("allowedRRanks: the game's 6 / 11 / 16 rule", () => {
  expect(allowedRRanks(5)).toEqual([]);
  expect(allowedRRanks(6)).toEqual([1]);
  expect(allowedRRanks(10)).toEqual([1]);
  expect(allowedRRanks(11)).toEqual([1, 2]);
  expect(allowedRRanks(15)).toEqual([1, 2]);
  expect(allowedRRanks(16)).toEqual([1, 2, 3]);
  expect(allowedRRanks(18)).toEqual([1, 2, 3]);
});

test("the page starts on the Early preset: level 6, R rank 1, 1 item + boots", () => {
  const state = s.initialState();
  expect(s.katarinaSetup(state)).toEqual({ level: 6, rRank: 1, itemCount: 1 });
  expect(s.bootsSetting(state)).toBe("tier2");
  expect(state.ability).toBe("r");
});

test("a stage preset fills in level, R rank, item count and the dummy's level", () => {
  const state = s.applyStage(s.initialState(), "late");
  expect(s.katarinaSetup(state)).toEqual({ level: 16, rRank: 3, itemCount: 3 });
  expect(state.dummyLevel).toBe(16);
});

test("changing the level sets R to the highest legal rank", () => {
  let state = s.applyStage(s.initialState(), "full"); // level 18, rank 3
  state = s.setLevel(state, 10);
  expect(state.ranks.r).toBe(1); // 10 is still rank 1 only
  state = s.setLevel(state, 13);
  expect(state.ranks.r).toBe(2);
  state = s.setLevel(state, 4);
  expect(state.ranks.r).toBe(0);
  expect(s.katarinaSetup(state)).toBeNull(); // no R yet: nothing to search
});

test("levels are kept between 1 and 18, and rounded", () => {
  const state = s.initialState();
  expect(s.setLevel(state, 25).level).toBe(18);
  expect(s.setLevel(state, 0).level).toBe(1);
  expect(s.setLevel(state, 12.6).level).toBe(13);
});

test("R rank boxes: a lower rank is fine, an illegal one is ignored", () => {
  const late = s.applyStage(s.initialState(), "late"); // level 16
  expect(s.setRank(late, "r", 1).ranks.r).toBe(1);
  const early = s.initialState(); // level 6
  expect(s.setRank(early, "r", 2).ranks.r).toBe(1); // unchanged
  expect(s.setRank(early, "q", 5).ranks.q).toBe(5); // basic abilities: no rules yet
});

test("the dummy's level follows Katarina's until the user edits it", () => {
  let state = s.setLevel(s.initialState(), 9);
  expect(state.dummyLevel).toBe(9);
  state = s.setDummyLevel(state, 13);
  state = s.setLevel(state, 7);
  expect(state.dummyLevel).toBe(13);
  state = s.applyStage(state, "mid"); // a preset starts following again
  expect(state.dummyLevel).toBe(11);
  expect(s.setLevel(state, 12).dummyLevel).toBe(12);
});

test("+/- slots: 1 to 5 items with boots, 1 to 6 without", () => {
  let state = s.applyStage(s.initialState(), "full"); // 5 + boots
  expect(s.changeItemCount(state, +1).itemCount).toBe(5);
  state = s.setBootsOn(state, false);
  expect(state.itemCount).toBe(5);
  state = s.changeItemCount(state, +1);
  expect(state.itemCount).toBe(6);
  state = s.setBootsOn(state, true); // boots take a slot back
  expect(state.itemCount).toBe(5);
  let one = s.initialState();
  one = s.changeItemCount(one, -1);
  expect(one.itemCount).toBe(1);
});

test("the mid quest needs boots", () => {
  let state = s.setMidQuest(s.initialState(), true);
  expect(s.bootsSetting(state)).toBe("tier3");
  state = s.setBootsOn(state, false);
  expect(s.bootsSetting(state)).toBe("off");
  expect(s.setMidQuest(state, true).midQuest).toBe(false);
});

test("unticking 'Use recommended items' starts from the recommended list", () => {
  const mid = s.applyStage(s.setEnemyType(s.initialState(), "tank"), "mid");
  const custom = s.setUseRecommendedItems(mid, false);
  const sortedNames = (state: s.PageState) => s.dummyItems(state).map((i) => i.name).sort();
  expect(sortedNames(custom)).toEqual(sortedNames(mid)); // same items (order doesn't matter)
  // Bug found in the browser: Nami's Dream Maker is a SUPPORT item and was dropped.
  const nami = s.applyStage(s.initialState(), "late");
  expect(sortedNames(s.setUseRecommendedItems(nami, false))).toEqual(sortedNames(nami));
  const changed = s.setCustomDummyItem(custom, 0, "Thornmail");
  expect(s.dummyItems(changed).map((i) => i.name)).toContain("Thornmail");
  const noBoots = s.setCustomDummyBoots(changed, null);
  expect(s.dummyItems(noBoots).some((i) => i.category === "boots")).toBe(false);
});

test("a typed number overrides the calculated one, and changing the dummy clears it", () => {
  let state = s.setTypedStat(s.initialState(), "armor", 200);
  const target = s.dummyTarget(state);
  expect(target.baseArmor + target.bonusArmor).toBe(200);
  state = s.setEnemyType(state, "tank");
  expect(state.typedDummyStats.armor).toBeNull();
});

test("withTypedStats: base stays the champion's, bonus = typed − base", () => {
  const nami = dummyStats(dummyPresets.squishy.champion, 11, [getItem("Thornmail")]);
  const typed = withTypedStats(nami, { hp: 3000, armor: 150, magicResist: null });
  expect(typed.hp).toBe(3000);
  expect(typed.bonusHp).toBeCloseTo(3000 - (nami.hp - nami.bonusHp));
  expect(typed.baseArmor).toBe(nami.baseArmor);
  expect(typed.bonusArmor).toBeCloseTo(150 - nami.baseArmor);
  expect(typed.bonusMagicResist).toBe(nami.bonusMagicResist); // not typed: unchanged
});

test("withTypedStats: below the champion's base, base = typed and bonus = 0", () => {
  const nami = dummyStats(dummyPresets.squishy.champion, 11, []);
  const typed = withTypedStats(nami, { hp: 100, armor: 10, magicResist: 0 });
  expect(typed.baseArmor).toBe(10);
  expect(typed.bonusArmor).toBe(0);
  expect(typed.baseMagicResist).toBe(0);
  expect(typed.bonusMagicResist).toBe(0);
  expect(typed.bonusHp).toBe(0);
});
