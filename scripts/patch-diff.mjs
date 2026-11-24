// Patch day: what changed in Riot's item data between two item snapshots?
//
// Usage:  node scripts/patch-diff.mjs                     compares the two newest snapshots
//         node scripts/patch-diff.mjs <old.json> <new.json>
//
// Item STATS need no work: the site reads them straight from the snapshot. What needs a person is
// the hand-coded part: item passives (src/items/) and the item checklist in NOTES.md. So this sorts
// every change by how much attention it needs, using each item's checklist status.
import { readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// The item checklist in NOTES.md: item name → status ("modelled", "to model", ...).
// Same reading as tests/item-checklist.test.ts: rows look like "| Item name | status | why |".
export function readChecklist() {
  const section = readFileSync("NOTES.md", "utf8").split("## Item checklist")[1] ?? "";
  const statusByName = new Map();
  for (const line of section.split("\n")) {
    const [, name, status] = line.split("|").map((c) => c.trim());
    if (!name || !status || name === "Item" || name.startsWith("---")) continue;
    statusByName.set(name, status);
  }
  return statusByName;
}

// The two newest snapshots in src/data/, oldest first. Patch "26.9" < "26.10", so compare numbers.
export function newestSnapshots() {
  const byPatch = (file) => file.match(/items\.(\d+)\.(\d+)\.json/).slice(1).map(Number);
  const files = readdirSync("src/data")
    .filter((f) => /^items\.\d+\.\d+\.json$/.test(f))
    .sort((a, b) => {
      const [a1, a2] = byPatch(a);
      const [b1, b2] = byPatch(b);
      return a1 - b1 || a2 - b2;
    });
  return files.slice(-2).map((f) => `src/data/${f}`);
}

const fmt = (v) => (v === undefined ? "none" : String(v));

// Everything that differs about one item, as readable lines (empty = unchanged), and whether any
// passive or active changed.
function itemChanges(before, after) {
  const lines = [];
  let passive = false;
  if (before.gold !== after.gold) lines.push(`gold ${before.gold} → ${after.gold}`);
  if (before.category !== after.category) lines.push(`category ${before.category} → ${after.category}`);
  for (const stat of new Set([...Object.keys(before.stats), ...Object.keys(after.stats)])) {
    if (before.stats[stat] !== after.stats[stat]) lines.push(`${stat} ${fmt(before.stats[stat])} → ${fmt(after.stats[stat])}`);
  }
  const effectText = (item) => new Map(item.effects.map((e) => [`${e.kind} "${e.name}"`, e.text]));
  const [oldEffects, newEffects] = [effectText(before), effectText(after)];
  for (const key of new Set([...oldEffects.keys(), ...newEffects.keys()])) {
    const [was, now] = [oldEffects.get(key), newEffects.get(key)];
    if (was === now) continue;
    passive = true;
    if (was === undefined) lines.push(`NEW ${key}: ${now}`);
    else if (now === undefined) lines.push(`REMOVED ${key} (was: ${was})`);
    else lines.push(`${key} text changed:\n      was: ${was}\n      now: ${now}`);
  }
  return { lines, passive };
}

// The report, as Markdown.
export function itemDiff(oldFile, newFile, checklist = readChecklist()) {
  const [before, after] = [oldFile, newFile].map((f) => JSON.parse(readFileSync(f, "utf8")));
  const oldByName = new Map(before.items.map((i) => [i.name, i]));
  const newByName = new Map(after.items.map((i) => [i.name, i]));
  const status = (name) => checklist.get(name) ?? (newByName.get(name)?.category === "support" ? "support (dummy only)" : "not on the checklist");
  const block = (name, lines) => `- **${name}** (${status(name)})\n${lines.map((l) => `    - ${l}`).join("\n")}`;

  const groups = { coded: [], added: [], removed: [], passiveText: [], statsOnly: [] };
  for (const [name, item] of newByName) {
    if (!oldByName.has(name)) groups.added.push(`- **${name}** (${item.category}, ${item.gold} gold)`);
  }
  for (const [name] of oldByName) {
    if (!newByName.has(name)) groups.removed.push(`- **${name}** (${status(name)})`);
  }
  for (const [name, item] of newByName) {
    const was = oldByName.get(name);
    if (!was) continue;
    const { lines, passive } = itemChanges(was, item);
    if (lines.length === 0) continue;
    if (["modelled", "to model"].includes(status(name))) groups.coded.push(block(name, lines));
    else if (passive) groups.passiveText.push(block(name, lines));
    else groups.statsOnly.push(block(name, lines));
  }

  const section = (title, what, list) => (list.length ? `### ${title}\n${what}\n\n${list.join("\n")}\n` : "");
  const body = [
    section(
      "Hand-coded items that changed: CHECK THESE",
      "The passive is coded in src/items/. Stat changes are picked up by themselves, but re-read the wiki page and make sure the code (and its test) still match.",
      groups.coded,
    ),
    section(
      "New items",
      'Add each to the item checklist in NOTES.md as "not checked yet", then read its passive: does it change Death Lotus damage?',
      groups.added,
    ),
    section(
      "Removed items",
      "Remove each from the NOTES.md checklist. If one was modelled, delete its file in src/items/ and its test.",
      groups.removed,
    ),
    section(
      "Passive text changed on items marked irrelevant",
      "Re-read the new text: could it change Death Lotus damage now? If so, change its checklist status.",
      groups.passiveText,
    ),
    section("Stats or price only", "Nothing to do: the site reads stats from the snapshot. Listed so you know.", groups.statsOnly),
  ].join("\n");

  return `## Items: ${before.patch} → ${after.patch}\n\n${body.trim() || "No item changed."}\n`;
}

// Run on its own: print the report.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [oldFile, newFile] = process.argv[2] ? process.argv.slice(2, 4) : newestSnapshots();
  if (!oldFile || !newFile) {
    console.log("Need two item snapshots to compare (src/data/items.<patch>.json). There is only one.");
  } else {
    console.log(itemDiff(oldFile, newFile));
  }
}
