// The dummy's item slots: with "Recommended" on they show the recommended items, and choosing
// a different item switches to custom items, changing only the clicked slot.
import { test, expect } from "vitest";
import * as s from "../../src/ui/state.ts";

const names = (state: s.PageState) => s.dummyItems(state).map((i) => i.name).sort();

test("with Recommended on, the slots show exactly the recommended items", () => {
  const state = s.applyStage(s.initialState(), "late");
  const { boots, items } = s.dummySlots(state);
  const shown = [boots, ...items].filter((n): n is string => n !== null).sort();
  expect(shown).toEqual(names(state));
});

test("choosing an item while Recommended is on switches to custom, changing only that slot", () => {
  const before = s.applyStage(s.initialState(), "late");
  const old = s.dummySlots(before);
  const after = s.setDummySlot(before, 1, "Thornmail");
  expect(after.useRecommendedItems).toBe(false);
  const now = s.dummySlots(after);
  expect(now.boots).toBe(old.boots);
  expect(now.items[0]).toBe(old.items[0]);
  expect(now.items[1]).toBe("Thornmail");
  expect(now.items[2]).toBe(old.items[2]);
});

test("removing the boots empties only the boots slot", () => {
  const state = s.setDummySlot(s.applyStage(s.initialState(), "mid"), "boots", null);
  expect(s.dummySlots(state).boots).toBeNull();
  expect(s.dummyItems(state).some((i) => i.category === "boots")).toBe(false);
});
