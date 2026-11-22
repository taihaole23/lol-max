// Makes sure the item checklist in NOTES.md covers every legendary and boots item,
// so an item added on a future patch can't be skipped by accident.
import { test, expect } from "vitest";
import { items, getItem } from "../src/data/items.ts";
import { itemPassives } from "../src/items/index.ts";
// "?raw" is a Vite feature: it loads the file's text as a plain string.
import notes from "../NOTES.md?raw";

const STATUSES = ["modelled", "to model", "checked, irrelevant", "not checked yet"];

// Reads the checklist tables at the end of NOTES.md.
// A row looks like: | Item name | status | why |
function readChecklist(): Map<string, string> {
  const section = notes.split("## Item checklist")[1];
  if (!section) throw new Error('NOTES.md has no "## Item checklist" section.');

  const statusByName = new Map<string, string>();
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    // cells[0] is the empty text before the first "|". Skip header and divider rows.
    const [, name, status] = cells;
    if (!name || !status || name === "Item" || name.startsWith("---")) continue;
    statusByName.set(name, status);
  }
  return statusByName;
}

const checklist = readChecklist();
const checkedItems = items.filter((i) => i.category !== "support"); // support items are only for the dummy

test("every legendary and boots item is in the checklist", () => {
  const missing = checkedItems.map((i) => i.name).filter((name) => !checklist.has(name));
  expect(missing).toEqual([]);
});

test("every row has a known status", () => {
  for (const [name, status] of checklist) {
    expect(STATUSES, `${name} has status "${status}"`).toContain(status);
  }
});

test("every coded passive belongs to a real item, and is coded only once", () => {
  for (const passive of itemPassives) getItem(passive.name); // throws on a typo
  const names = itemPassives.map((p) => p.name);
  expect(new Set(names).size).toBe(names.length);
});

test("every coded item is marked 'modelled' (or 'to model' if only part of it is coded yet)", () => {
  for (const passive of itemPassives) {
    expect(["modelled", "to model"], passive.name).toContain(checklist.get(passive.name));
  }
});

test("every item marked 'modelled' has a coded passive", () => {
  const coded = new Set(itemPassives.map((p) => p.name));
  for (const [name, status] of checklist) {
    if (status === "modelled") expect(coded.has(name), name).toBe(true);
  }
});

test("the checklist has no rows for items that aren't in the snapshot", () => {
  const names = new Set(checkedItems.map((i) => i.name));
  const extra = [...checklist.keys()].filter((name) => !names.has(name));
  expect(extra).toEqual([]);
});
