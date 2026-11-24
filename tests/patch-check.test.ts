// After a patch: every hand-typed number must be re-checked before the site says it's up to date.
//
// This test reads the TEXT of every source file in src/ and finds each `patch: "..."` (the patch
// a number was last checked on). Reading the text, instead of importing the data, means it also
// finds sources that are never shown on the site (like an item's `bugSource`), and any new file
// added later, with nothing to register.
import { test, expect } from "vitest";
import { PATCH } from "../src/data/patch.ts";

// Every .ts file in src/, as text. Keys look like "/src/items/eclipse.ts".
const files = import.meta.glob<string>("/src/**/*.ts", { query: "?raw", import: "default", eager: true });

// Each `patch: ...` in the code, with the file and line it's on. Comment lines are skipped
// (a comment may mention "patch:" as an example).
const found = Object.entries(files).flatMap(([file, text]) =>
  text.split("\n").flatMap((line, i) => {
    if (line.trim().startsWith("//")) return [];
    const match = line.match(/\bpatch:\s*([^,}\s]+)/);
    return match ? [{ where: `${file}:${i + 1}`, value: match[1] }] : [];
  }),
);

test("the test finds the sources (if this fails, the search pattern above broke)", () => {
  expect(found.length).toBeGreaterThan(50);
});

test("a source's patch is written out, never borrowed from PATCH", () => {
  // Allowed: a plain "26.23"; a snapshot's own patch (`snapshot.patch`: the download scripts
  // write it, so it's always the patch the file was really downloaded for); and `patch: string`,
  // which is a TYPE (it describes what a source looks like, it isn't a value).
  const allowed = new Set(["snapshot.patch", "string"]);
  const borrowed = found.filter((s) => !/^"\d+\.\d+"$/.test(s.value) && !allowed.has(s.value));
  expect(borrowed.map((s) => `${s.where}  patch: ${s.value}`)).toEqual([]);
});

test(`every hand-typed number was checked on the site's patch (${PATCH})`, () => {
  const old = found.filter((s) => s.value.startsWith('"') && s.value !== `"${PATCH}"`);
  // On failure this lists each source to re-check. For each one: open its url (the line above
  // or below it), compare the numbers, fix any that changed, then write the new patch.
  expect(old.map((s) => `${s.where}  last checked on ${s.value}`)).toEqual([]);
});
