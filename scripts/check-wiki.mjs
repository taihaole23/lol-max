// Patch day: did the wiki change any number the site uses?
//
// The site's hand-typed numbers (Katarina, the dummy champions, game rules, item passives) were
// copied from the wiki. The site never reads the wiki by itself, so a change there (say Death
// Lotus's AP ratio goes up) would go unnoticed. This script keeps a saved copy of every wiki text
// the numbers came from, in wiki-watch/, and shows what changed since.
//
// Usage:  node scripts/check-wiki.mjs            compare the wiki with the saved copies (changes nothing)
//         node scripts/check-wiki.mjs --accept   save the wiki as it is now
//
// Only use --accept AFTER every change it listed is handled (numbers updated, or checked and not
// needed). The saved copies mean "the site agrees with this".
//
// What is watched (found by itself, so a new source is watched with no extra work):
//   - every wiki page linked as a `source` anywhere in src/ (raw page text, including notes)
//   - each linked champion ("Katarina/LoL") → that champion's block in Module:ChampionData/data,
//     where the wiki keeps base stats and growth (the champion page itself only shows them)
//   - each item in the item snapshot → its block in Module:ItemData/data, where the wiki keeps
//     item stats, passive text and "only one of" groups
//   - the ability pages of every ability the site calculates (abilityPages below)
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const WIKI = "https://wiki.leagueoflegends.com/en-us/";
const WATCH_DIR = "wiki-watch";
// A plain name for our requests, no personal details (the wiki asks scripts to name themselves).
const USER_AGENT = "lol-max-patch-check (static site, run by hand on patch day)";

// The wiki pages with the numbers of each ability the site calculates. When a new ability is
// modelled, add its page here: Template:Data_<Champion>/<Ability name>.
const abilityPages = [
  "Template:Data_Katarina/Bouncing_Blade",
  "Template:Data_Katarina/Shunpo",
  "Template:Data_Katarina/Death_Lotus",
];

// Big data modules: only the blocks we use are kept, not the whole page.
const CHAMPION_DATA = "Module:ChampionData/data";
const ITEM_DATA = "Module:ItemData/data";

// ---- Which pieces to watch ----

// Every wiki page linked in src/, as page titles ("Liandry's_Torment", "Katarina/LoL").
function linkedPages() {
  const files = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(path);
      else if (path.endsWith(".ts")) files.push(path);
    }
  })("src");
  const titles = new Set();
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    // Full links, and links written as WIKI + "Page" (champions.ts, game-rules.ts).
    for (const [, page] of text.matchAll(/https:\/\/wiki\.leagueoflegends\.com\/en-us\/([^"'`\s)]+)/g)) if (page) titles.add(decodeURIComponent(page));
    for (const [, page] of text.matchAll(/WIKI\s*\+\s*"([^"]+)"/g)) titles.add(decodeURIComponent(page));
  }
  return [...titles];
}

// The current item snapshot's item names (the ones the site can use).
function snapshotItemNames() {
  const patch = readFileSync("src/data/patch.ts", "utf8").match(/PATCH\s*=\s*"([^"]+)"/)[1];
  const snapshot = JSON.parse(readFileSync(`src/data/items.${patch}.json`, "utf8"));
  return snapshot.items.filter((i) => i.category !== "support").map((i) => i.name);
}

// Each piece: a name (also its file name in wiki-watch/) and how to get its text from the wiki.
function watchedPieces() {
  const pages = new Set([...linkedPages(), ...abilityPages]);
  const pieces = [];
  for (const page of [...pages].sort()) {
    const champion = page.match(/^([^/]+)\/LoL$/)?.[1];
    if (champion) {
      // The champion page itself is layout; the numbers are in the champion data module.
      pieces.push({ name: `champion-data/${champion.replaceAll("_", " ")}`, page: CHAMPION_DATA, block: champion.replaceAll("_", " ") });
    } else if (page === ITEM_DATA) {
      // Linked for item groups. Covered by the item blocks below.
    } else {
      pieces.push({ name: `page/${page}`, page });
    }
  }
  for (const item of snapshotItemNames()) pieces.push({ name: `item-data/${item}`, page: ITEM_DATA, block: item });
  return pieces;
}

// ---- Reading the wiki ----

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// If the wiki says "too many requests" (429) or is briefly down (5xx), wait and try again: 5 s,
// then 10, 20, 40 (or as long as the wiki asks, in its Retry-After header).
async function rawPage(page) {
  const url = `${WIKI}${encodeURI(page).replaceAll("'", "%27")}?action=raw`;
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.ok) return (await response.text()).replace(/\r/g, "");
    const temporary = response.status === 429 || response.status >= 500;
    if (!temporary || attempt === 4) throw new Error(`${response.status} for ${url}`);
    const asked = Number(response.headers.get("retry-after")) * 1000;
    const delay = asked || 5000 * 2 ** attempt;
    console.warn(`  wiki answered ${response.status} for ${page}; trying again in ${Math.round(delay / 1000)} s`);
    await wait(delay);
  }
}

// One entry of a Lua data module:   ["Liandry's Torment"] = {  ...  },
// From that line to the closing brace at the same indent.
// Upper/lower case is ignored: Riot writes "Blade of The Ruined King", the wiki "Blade of the Ruined King".
function luaBlock(text, name) {
  const lines = text.split("\n");
  const quoted = JSON.stringify(name).slice(1, -1).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const header = new RegExp(`^\\s*\\["${quoted}"\\]\\s*=\\s*\\{`, "i");
  const start = lines.findIndex((l) => header.test(l));
  if (start === -1) return null;
  const indent = lines[start].match(/^\s*/)[0];
  const end = lines.findIndex((l, i) => i > start && l.startsWith(indent + "}"));
  return lines.slice(start, end === -1 ? undefined : end + 1).join("\n");
}

// Downloads every piece. Each page once, one at a time with a short pause, to go easy on the
// wiki (~60 pages: about half a minute).
async function fetchPieces(pieces) {
  const pages = [...new Set(pieces.map((p) => p.page))];
  const texts = new Map();
  for (const page of pages) {
    texts.set(page, await rawPage(page));
    await wait(300);
  }
  return pieces.map((p) => {
    const text = texts.get(p.page);
    const body = p.block ? luaBlock(text, p.block) : text;
    return { ...p, text: body === null ? null : body.split("\n").map((l) => l.trimEnd()).join("\n").trim() + "\n" };
  });
}

// ---- Saved copies ----

// Names can contain characters Windows doesn't allow in file names (Module:..., "/").
const fileOf = (name) => {
  const [folder, ...rest] = name.split("/");
  return `${WATCH_DIR}/${folder}/${rest.join("/").replace(/[\\/:*?"<>|]/g, "_")}.txt`;
};

function savedFiles() {
  if (!existsSync(WATCH_DIR)) return [];
  return readdirSync(WATCH_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => readdirSync(`${WATCH_DIR}/${d.name}`).map((f) => `${WATCH_DIR}/${d.name}/${f}`));
}

// ---- Comparing ----

// The lines removed (-) and added (+) between two texts: the "longest common subsequence" method,
// the same idea `git diff` uses. Unchanged lines are left out.
function lineDiff(before, after) {
  const a = before.split("\n");
  const b = after.split("\n");
  const common = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      common[i][j] = a[i] === b[j] ? common[i + 1][j + 1] + 1 : Math.max(common[i + 1][j], common[i][j + 1]);
    }
  }
  const out = [];
  let [i, j] = [0, 0];
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) [i, j] = [i + 1, j + 1];
    else if (i < a.length && (j === b.length || common[i + 1][j] >= common[i][j + 1])) out.push(`- ${a[i++]}`);
    else out.push(`+ ${b[j++]}`);
  }
  return out;
}

// Compares the wiki now with the saved copies. Returns { report (Markdown), changes (a count) }.
export async function checkWiki() {
  const pieces = await fetchPieces(watchedPieces());
  const changed = [];
  const fresh = [];
  const missing = [];
  for (const piece of pieces) {
    if (piece.text === null) {
      missing.push(`- **${piece.name}**: not found on ${piece.page} (renamed or removed?)`);
      continue;
    }
    const file = fileOf(piece.name);
    if (!existsSync(file)) {
      fresh.push(`- ${piece.name}`);
      continue;
    }
    const saved = readFileSync(file, "utf8").replace(/\r/g, "");
    if (saved === piece.text) continue;
    const diff = lineDiff(saved, piece.text);
    changed.push(`#### ${piece.name}\n${WIKI}${encodeURI(piece.page)}\n\`\`\`diff\n${diff.join("\n")}\n\`\`\``);
  }
  const sections = [
    changed.length && `### Changed on the wiki: CHECK THESE\n"-" = the saved copy, "+" = the wiki now. Wiki edits that don't touch numbers (wording, links) show up too: skim those.\n\n${changed.join("\n\n")}`,
    missing.length && `### Missing on the wiki\n${missing.join("\n")}`,
    fresh.length && `### Not saved before (nothing to compare with; saved by --accept)\n${fresh.join("\n")}`,
  ].filter(Boolean);
  const report = `## Wiki: changes since the saved copies (${pieces.length} pieces watched)\n\n${sections.join("\n\n") || "Nothing changed."}\n`;
  return { report, changes: changed.length + missing.length };
}

// Saves the wiki as it is now, and deletes saved copies of pieces no longer watched.
export async function acceptWiki() {
  const pieces = await fetchPieces(watchedPieces());
  const keep = new Set();
  for (const piece of pieces) {
    if (piece.text === null) continue;
    const file = fileOf(piece.name);
    mkdirSync(file.slice(0, file.lastIndexOf("/")), { recursive: true });
    writeFileSync(file, piece.text);
    keep.add(file);
  }
  for (const file of savedFiles()) if (!keep.has(file)) rmSync(file);
  return keep.size;
}

// Run on its own.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes("--accept")) {
    console.log(`Saved ${await acceptWiki()} wiki pieces to ${WATCH_DIR}/.`);
  } else {
    const { report, changes } = await checkWiki();
    console.log(report);
    process.exitCode = changes ? 1 : 0; // 1 = something to look at
  }
}
