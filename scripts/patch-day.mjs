// Patch day, the automatic part. Run:  npm run patch-day
// (Or type /patch-day in Claude Code: Claude runs this, then works through the report.)
//
// What it does:
//   1. Asks Data Dragon for the newest version, and works out the patch name (16.24.1 → 26.24).
//   2. If it's newer than the site's patch: changes PATCH and the snapshot file names, then
//      downloads the new items (update-items.mjs) and icons + splash colours (update-icons.mjs).
//   3. Lists what changed: items (patch-diff.mjs) and the wiki (check-wiki.mjs).
//   4. Runs the tests.
//   5. Writes everything into patch-report.md (not committed: it's only for today).
//
// It never edits a hand-typed number: that's for a person (or Claude) reading the report.
// Usage:  node scripts/patch-day.mjs [Data Dragon version]   (no version = the newest)
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { checkWiki } from "./check-wiki.mjs";
import { itemDiff } from "./patch-diff.mjs";

const REPORT = "patch-report.md";

// Riot names patches by year (26.24 in 2026); Data Dragon still counts the old way (16.24.1).
// So the patch = Data Dragon's first number + 10, then its second number. The script checks this
// rule against the current snapshot before trusting it.
const patchOf = (ddragonVersion) => {
  const [major, minor] = ddragonVersion.split(".").map(Number);
  return `${major + 10}.${minor}`;
};

const patchFile = "src/data/patch.ts";
const readPatch = () => readFileSync(patchFile, "utf8").match(/PATCH\s*=\s*"([^"]+)"/)[1];

// Runs a command line, e.g. "node scripts/update-items.mjs 16.24.1". It goes through the shell
// because on Windows `npm` can only be started that way. Only our own fixed commands and a Data
// Dragon version number are ever passed, so nothing unexpected can end up in it.
const shellRun = (commandLine, options) => spawnSync(commandLine, { shell: true, ...options });

// Runs another script and shows its output. Stops patch day if it fails.
function run(label, commandLine) {
  console.log(`\n=== ${label}`);
  const result = shellRun(commandLine, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(
      `${label} failed (see above). PATCH and the snapshot file names may already be changed: ` +
        "to undo everything, discard the changes in GitHub Desktop, then try again.",
    );
  }
}

// Changes `from` to `to` in a file, and fails loudly if `from` isn't there (so nothing is half-done silently).
function replaceIn(file, from, to) {
  const text = readFileSync(file, "utf8");
  if (!text.includes(from)) throw new Error(`Expected "${from}" in ${file}.`);
  writeFileSync(file, text.replace(from, to));
}

// ---- 1. Which patch is out? ----
const versions = await (await fetch("https://ddragon.leagueoflegends.com/api/versions.json")).json();
const ddragonVersion = process.argv[2] ?? versions[0];
if (!/^\d+\.\d+\.\d+$/.test(ddragonVersion)) throw new Error(`"${ddragonVersion}" doesn't look like a Data Dragon version (e.g. 16.24.1).`);
const oldPatch = readPatch();
const oldSnapshot = JSON.parse(readFileSync(`src/data/items.${oldPatch}.json`, "utf8"));
if (patchOf(oldSnapshot.ddragonVersion) !== oldPatch) {
  throw new Error(
    `The naming rule broke: Data Dragon ${oldSnapshot.ddragonVersion} should be patch ${oldPatch}, ` +
      `but the rule says ${patchOf(oldSnapshot.ddragonVersion)}. Fix patchOf in this script.`,
  );
}
const newPatch = patchOf(ddragonVersion);
const sections = [];

if (newPatch === oldPatch) {
  console.log(`Already on the newest patch (${oldPatch}, Data Dragon ${ddragonVersion}). Nothing to download.`);
  console.log("Checking the wiki anyway: it's often updated a day or two after the patch.");
  sections.push(`Already on the newest patch. Only the wiki was checked.`);
} else {
  // ---- 2. Switch to the new patch and download ----
  console.log(`New patch: ${oldPatch} → ${newPatch} (Data Dragon ${ddragonVersion}).`);
  replaceIn(patchFile, `PATCH = "${oldPatch}"`, `PATCH = "${newPatch}"`);
  replaceIn("src/data/items.ts", `./items.${oldPatch}.json`, `./items.${newPatch}.json`);
  replaceIn("src/data/champion-list.ts", `./champion-list.${oldPatch}.json`, `./champion-list.${newPatch}.json`);
  run("Downloading items", `node scripts/update-items.mjs ${ddragonVersion}`);
  run("Downloading icons, splash art and splash colours", `node scripts/update-icons.mjs ${ddragonVersion}`);

  // ---- 3a. Item changes ----
  console.log("\n=== Comparing items");
  sections.push(itemDiff(`src/data/items.${oldPatch}.json`, `src/data/items.${newPatch}.json`));
}

// ---- 3b. Wiki changes ----
console.log("\n=== Checking the wiki (about half a minute)");
sections.push((await checkWiki()).report);

// ---- 4. Tests ----
console.log("\n=== Running the tests");
const tests = shellRun("npm test", { encoding: "utf8" });
const testOutput = `${tests.stdout}\n${tests.stderr}`;
// Keep only what matters: which tests failed, the lines they list, and the totals.
const important = testOutput
  .split("\n")
  .filter((l) => /FAIL|×|Test Files|Tests\s|^\s*[+-]\s+"/.test(l))
  .slice(0, 150);
sections.push(
  `## Tests\n${tests.status === 0 ? "All passed." : "Some failed (expected after a new patch: each failure is a to-do):"}\n\n\`\`\`\n${important.join("\n")}\n\`\`\``,
);

// ---- 5. The report ----
const title = newPatch === oldPatch ? `Patch check: ${oldPatch}` : `Patch day: ${oldPatch} → ${newPatch}`;
const nextSteps = `## Next steps
1. **Items**: work through each "CHECK THESE" item above (the wiki page, then src/items/ and its test).
2. **Wiki**: for each change listed, update the number in src/ (or confirm it doesn't matter).
3. **patch-check test**: for each source it lists, re-check its page and write the new patch on it.
4. **Practice Tool**: decide which measurements this patch made out of date (rules at the top of tests/practice-tool-cases.ts): put those in \`needsRemeasuring\`, then move \`stillValidOnPatch\` to the new patch.
5. When everything above is handled: \`node scripts/check-wiki.mjs --accept\`, then \`npm test\` and \`npm run test:slow\`.
${newPatch === oldPatch ? "" : `- Delete the old snapshots (items.${oldPatch}.json, champion-list.${oldPatch}.json); git keeps them in history.\n`}6. Update NOTES.md, try the site (\`npm run dev\`), commit.`;
writeFileSync(REPORT, `# ${title}\n\n${sections.join("\n\n")}\n\n${nextSteps}\n`);
console.log(`\nDone. Report: ${REPORT}`);
