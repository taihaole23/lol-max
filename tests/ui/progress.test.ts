import { test, expect } from "vitest";
import { easterEgg, progressLabel } from "../../src/ui/progress.ts";
import * as s from "../../src/ui/state.ts";
import { keyOf } from "../../src/ui/searches.ts";

test("progress label: a percentage, except the thebausffs easter egg from 40% to 60%", () => {
  expect(progressLabel(0)).toBe("0%");
  expect(progressLabel(0.399)).toBe("39%");
  expect(progressLabel(0.4)).toBe(easterEgg.text);
  expect(progressLabel(0.59)).toBe(easterEgg.text);
  expect(progressLabel(0.6)).toBe("60%");
  expect(progressLabel(1)).toBe("100%");
});

test("search requests: quick = 1 item, full = the slot count, none before level 6", () => {
  const state = s.applyStage(s.initialState(), "late");
  expect(s.searchRequest(state, 1)?.itemCount).toBe(1);
  expect(s.searchRequest(state, state.itemCount)?.itemCount).toBe(3);
  expect(s.searchRequest(s.setLevel(state, 5), 1)).toBeNull();
});

test("search keys: +/- slots changes only the full question, not the quick one", () => {
  const before = s.applyStage(s.initialState(), "late");
  const after = s.changeItemCount(before, +1);
  expect(keyOf(s.searchRequest(after, 1))).toBe(keyOf(s.searchRequest(before, 1)));
  expect(keyOf(s.searchRequest(after, after.itemCount))).not.toBe(keyOf(s.searchRequest(before, before.itemCount)));
});

test("search keys: with 1 slot, the quick question IS the full question", () => {
  const early = s.initialState();
  expect(keyOf(s.searchRequest(early, 1))).toBe(keyOf(s.searchRequest(early, early.itemCount)));
});

test("search keys: another ability is another question; another ability's rank isn't", () => {
  const state = s.initialState(); // R selected
  const key = keyOf(s.searchRequest(state, 1));
  expect(keyOf(s.searchRequest(s.selectAbility(state, "q"), 1))).not.toBe(key);
  expect(keyOf(s.searchRequest(s.setRank(state, "q", 3), 1))).toBe(key); // Q 3 → 2 doesn't change R
  expect(s.searchRequest(s.selectAbility(state, "w"), 1)).toBeNull(); // W deals no damage
});
