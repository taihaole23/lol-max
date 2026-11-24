// Locks and bans in the page's state (src/ui/state.ts).
import { test, expect } from "vitest";
import { getItem } from "../../src/data/items.ts";
import * as s from "../../src/ui/state.ts";

const late = () => s.applyStage(s.initialState(), "late"); // 3 items + boots

test("locking puts the item in that slot and in the search's required list", () => {
  const state = s.lockItem(late(), 1, "Zhonya's Hourglass");
  expect(state.locked[1]).toBe("Zhonya's Hourglass");
  expect(s.buildConstraints(state).required).toEqual(["Zhonya's Hourglass"]);
  expect(s.fullSearchRequest(state)?.constraints?.required).toEqual(["Zhonya's Hourglass"]);
});

test("an item can only be locked in one slot; locking un-bans it", () => {
  let state = s.banItem(late(), "Void Staff");
  state = s.lockItem(state, 0, "Void Staff");
  state = s.lockItem(state, 2, "Void Staff");
  expect(state.locked).toEqual([null, null, "Void Staff"]);
  expect(state.banned).toEqual([]);
});

test("banning removes a lock of that item", () => {
  let state = s.lockItem(late(), 0, "Void Staff");
  state = s.banItem(state, "Void Staff");
  expect(state.locked[0]).toBeNull();
  expect(s.buildConstraints(state).banned).toEqual(["Void Staff"]);
  expect(s.unbanItem(state, "Void Staff").banned).toEqual([]);
});

test("removing a slot removes its lock; boots off / mid quest drop locked boots", () => {
  let state = s.lockItem(late(), 2, "Zhonya's Hourglass");
  state = s.changeItemCount(state, -1);
  expect(s.buildConstraints(state).required).toEqual([]);
  state = s.lockBoots(state, "Sorcerer's Shoes");
  expect(s.setMidQuest(state, true).lockedBoots).toBeNull();
  expect(s.setBootsOn(state, false).lockedBoots).toBeNull();
});

test("the quick search = locked items + 1 free slot", () => {
  let state = s.lockItem(late(), 0, "Zhonya's Hourglass");
  expect(s.quickSearchRequest(state)?.itemCount).toBe(2);
  state = s.lockItem(state, 1, "Rabadon's Deathcap");
  state = s.lockItem(state, 2, "Void Staff");
  expect(s.quickSearchRequest(state)?.itemCount).toBe(3); // every slot locked: quick = full
});

test("impossible locks: a message, and no search", () => {
  let state = s.lockItem(late(), 0, "Void Staff");
  state = s.lockItem(state, 1, "Terminus");
  expect(s.conditionProblem(state)).toMatch(/can't be built together/);
  expect(s.fullSearchRequest(state)).toBeNull();
});

test("arrangeSlots: locked items stay in their slot, the rest fill the free ones", () => {
  let state = s.lockItem(late(), 1, "Zhonya's Hourglass");
  state = s.lockBoots(state, "Sorcerer's Shoes");
  const build = ["Rabadon's Deathcap", "Zhonya's Hourglass", "Void Staff", "Sorcerer's Shoes"].map(getItem);
  const slots = s.arrangeSlots(state, build);
  expect(slots.boots).toEqual({ item: getItem("Sorcerer's Shoes"), locked: true });
  expect(slots.items.map((c) => c && `${c.item.name}${c.locked ? " (locked)" : ""}`)).toEqual([
    "Rabadon's Deathcap",
    "Zhonya's Hourglass (locked)",
    "Void Staff",
  ]);
  // Before any result: only the locked item shows.
  expect(s.arrangeSlots(state, undefined).items.map((c) => c?.item.name ?? null)).toEqual([null, "Zhonya's Hourglass", null]);
});
