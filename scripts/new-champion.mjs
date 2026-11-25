// Adding a champion, the automatic part. Run:  node scripts/new-champion.mjs Lux
//
// It reads the champion from the wiki (base stats, attack range, ability names, and each ability's
// "leveling" text with its damage numbers) and writes a DRAFT data file, src/data/<slug>.ts.
// The draft has everything that can be read without judgement. What still needs a person (or
// Claude) is marked TODO: the skill order, which abilities deal damage, and each ability's `spec`
// (hit times, which ratios, on-hit or not). The raw wiki text of each ability is kept as a
// comment next to it, so nothing has to be looked up again.
//
// After the draft: register the champion in src/data/playable-champions.ts (3 small entries),
// write tests/<slug>.test.ts, add the ability pages to scripts/check-wiki.mjs, and run
// `npm run update-icons` for the icons. NOTES.md has the full checklist ("Adding a champion").
//
// It never overwrites a file that already exists. `--print` only prints the draft.
import { existsSync, writeFileSync } from "node:fs";
import { luaBlock, rawPage } from "./check-wiki.mjs";

const WIKI = "https://wiki.leagueoflegends.com/en-us/";
const KEYS = ["q", "w", "e", "r"];

// ["hp_base"]  = 580,   →  580
function luaNumber(block, key) {
  const match = block.match(new RegExp(`\\["${key}"\\]\\s*=\\s*(-?[\\d.]+)`));
  if (!match) throw new Error(`No ${key} in the champion's data`);
  return Number(match[1]);
}

function luaString(block, key) {
  return block.match(new RegExp(`\\["${key}"\\]\\s*=\\s*"([^"]*)"`))?.[1];
}

// ["skill_q"] = {[1] = "Light Binding"}  →  "Light Binding" (the first one, if there are several)
function skillName(block, key) {
  return block.match(new RegExp(`\\["skill_${key}"\\]\\s*=\\s*\\{\\[1\\]\\s*=\\s*"([^"]+)"`))?.[1];
}

// One field of an ability's data template:  |leveling = ...  up to the next  |field =  line.
function templateField(text, field) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => new RegExp(`^\\|${field}\\s*=`).test(l));
  if (start === -1) return "";
  const out = [lines[start].replace(/^\|[^=]+=\s*/, "")];
  for (let i = start + 1; i < lines.length && !/^\|[\w ]+=/.test(lines[i]) && lines[i] !== "}}"; i++) out.push(lines[i]);
  return out.join("\n").trim();
}

// "80 to 240" over 5 ranks → [80, 120, 160, 200, 240]; "80 / 120 / 160" → [80, 120, 160].
// Only plain numbers: anything the script can't read stays a TODO for a person.
export function rankNumbers(text, ranks) {
  const to = text.match(/^\s*(-?[\d.]+)\s+to\s+(-?[\d.]+)\s*$/);
  if (to) {
    const [a, b] = [Number(to[1]), Number(to[2])];
    if (ranks === 1) return [a];
    return Array.from({ length: ranks }, (_, i) => Math.round((a + ((b - a) * i) / (ranks - 1)) * 1000) / 1000);
  }
  const list = text.split("/").map((s) => s.trim());
  if (list.every((s) => /^-?[\d.]+$/.test(s))) {
    const numbers = list.map(Number);
    return numbers.length === 1 ? Array(ranks).fill(numbers[0]) : numbers;
  }
  return undefined;
}

// Best-effort reading of one "leveling" line:  {{st|Magic Damage|{{ap|80 to 240}} {{as|(+ 75% AP)}}}}
// → { label: "Magic Damage", base: [80, ...], ratios: { ap: 0.75 } }. Ratios with ranks become lists.
export function readLeveling(leveling, ranks) {
  const rows = [];
  for (const [, label, rawValue] of leveling.matchAll(/\{\{st\|([^|]+)\|(.+?)\}\}\s*$/gm)) {
    const value = rawValue.replace(/'''/g, ""); // bold markup: "'''bonus''' AD"
    const row = { label: label.trim() };
    const base = value.match(/^\{\{ap\|([^}]+)\}\}/) ?? value.match(/^([\d.\s/]+)(?=\s|\{|$)/);
    if (base) row.base = rankNumbers(base[1].replace(/\|/g, " / "), ranks);
    for (const [, inner] of value.matchAll(/\{\{as\|\(\+\s*([^)]*)\)\}\}/g)) {
      // "75% AP", "100% bonus AD", "{{ap|50 to 70}}% AP"
      const m = inner.match(/^(?:\{\{ap\|([^}]+)\}\}|([\d.\s/]+))%\s*(bonus AD|AD|AP)\b/);
      if (!m) continue;
      const numbers = rankNumbers((m[1] ?? m[2]).replace(/\|/g, " / "), ranks);
      if (!numbers) continue;
      const key = { AP: "ap", AD: "ad", "bonus AD": "bonusAd" }[m[3]];
      const fractions = numbers.map((n) => Math.round(n * 10) / 1000);
      row.ratios = { ...row.ratios, [key]: fractions.every((f) => f === fractions[0]) ? fractions[0] : fractions };
    }
    rows.push(row);
  }
  return rows;
}

const slugOf = (name) => name.toLowerCase().replace(/[^a-z]/g, "");
const camelOf = (name) => name.replace(/[^A-Za-z ]/g, "").split(" ").map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase())).join("");
const pageOf = (name) => name.replace(/ /g, "_");
const comment = (text, indent) => text.split("\n").map((l) => `${indent}// ${l}`).join("\n");

async function draft(name) {
  const data = luaBlock(await rawPage("Module:ChampionData/data"), name);
  if (!data) throw new Error(`${name} isn't in Module:ChampionData/data (check the spelling).`);
  const patch = (await import("node:fs")).readFileSync("src/data/patch.ts", "utf8").match(/PATCH\s*=\s*"([^"]+)"/)[1];
  const champUrl = `${WIKI}${pageOf(name)}/LoL`;
  const ranged = luaString(data, "rangetype") === "Ranged";

  const abilities = [];
  for (const key of KEYS) {
    const skill = skillName(data, key);
    const page = `Template:Data_${pageOf(name)}/${pageOf(skill)}`;
    const text = await rawPage(page);
    // Damage can be in any "leveling" field (Lux's E: leveling3, after the recast's description).
    const leveling = ["leveling", "leveling2", "leveling3", "leveling4", "leveling5"].map((f) => templateField(text, f)).filter(Boolean).join("\n");
    const ranks = key === "r" ? 3 : 5;
    abilities.push({ key, skill, url: WIKI + page, leveling, damagetype: templateField(text, "damagetype"), ranks, rows: readLeveling(leveling, ranks) });
  }

  const s = (k) => luaNumber(data, k);
  const out = [];
  out.push(`// ${name}'s game numbers. DRAFT written by scripts/new-champion.mjs from the wiki; check every TODO.`);
  out.push(`// Every group of numbers has a \`source\`: where it was read, and for which patch.`);
  out.push(`import type { AbilitySpec } from "../simulation/ability-spec.ts";`, "");
  out.push(`const WIKI_URL = "${champUrl}";`);
  for (const a of abilities) out.push(`const ${a.key.toUpperCase()}_URL = "${a.url}";`);
  out.push("", `export const ${slugOf(name)} = {`, `  name: "${name}",`, "");
  out.push(`  // Ranged champions stand at their attack range from the dummy (items with an aura check it).`);
  out.push(`  rangeType: {`, `    source: { url: WIKI_URL, patch: "${patch}" },`, `    type: "${ranged ? "ranged" : "melee"}" as const,`, `    attackRange: ${s("range")},`, `  },`, "");
  out.push(`  baseStats: {`, `    source: { url: WIKI_URL, patch: "${patch}" },`);
  out.push(`    health: { base: ${s("hp_base")}, perLevel: ${s("hp_lvl")} },`);
  out.push(`    armor: { base: ${s("arm_base")}, perLevel: ${s("arm_lvl")} },`);
  out.push(`    magicResist: { base: ${s("mr_base")}, perLevel: ${s("mr_lvl")} },`);
  out.push(`    attackDamage: { base: ${s("dam_base")}, perLevel: ${s("dam_lvl")} },`);
  out.push(`    attackSpeed: { base: ${s("as_base")}, bonusPerLevel: ${Math.round(s("as_lvl") * 1000) / 100000} },`);
  out.push(`    moveSpeed: ${s("ms")},`, `  },`, "");
  out.push(`  adaptiveType: {`, `    source: { url: WIKI_URL, patch: "${patch}" },`);
  out.push(`    whenTied: "${luaString(data, "adaptivetype") === "Magic" ? "ap" : "ad"}" as "ad" | "ap",`, `  },`, "");
  out.push(`  abilities: {`, `    source: { url: WIKI_URL, patch: "${patch}" },`, `    list: [`);
  for (const a of abilities) out.push(`      { key: "${a.key}", name: "${a.skill}", maxRank: ${a.ranks} },`);
  out.push(`    ],`, `  },`, "");
  out.push(`  // TODO: the usual skill order (R whenever possible, then the ability maxed first...).`);
  out.push(`  skillOrder: {`, `    start: ["q", "w", "e"],`, `    priority: ["r", "q", "w", "e"],`, `  },`, "");
  out.push(`  // Each damaging ability, in the shape src/simulation/ability-spec.ts reads. TODO: check each`);
  out.push(`  // one against the wiki text kept above it, remove the ones that deal no damage, and set the hits.`);
  out.push(`  specs: {`);
  for (const a of abilities) {
    out.push(comment(`${a.key.toUpperCase()}: ${a.skill} (damage type: ${a.damagetype || "?"})\n${a.leveling}`, "    "));
    const type = /physical/i.test(a.damagetype) ? "physical" : /true/i.test(a.damagetype) ? "true" : "magic";
    const row = a.rows.find((r) => /damage/i.test(r.label));
    out.push(`    ${a.key}: {`, `      source: { url: ${a.key.toUpperCase()}_URL, patch: "${patch}" },`, `      hits: [`);
    const ratios = row?.ratios ? `, ratios: ${JSON.stringify(row.ratios).replace(/"(\w+)":/g, "$1: ")}` : "";
    out.push(`        { time: 0, parts: [{ type: "${type}", base: ${JSON.stringify(row?.base ?? "TODO")}${ratios} }] },`);
    out.push(`      ],`, `    },`);
  }
  out.push(`  } satisfies Partial<Record<"q" | "w" | "e" | "r", AbilitySpec>>,`, `} as const;`, "");
  return { slug: slugOf(name), text: out.join("\n").replace(/"TODO"/g, "[] /* TODO */"), camel: camelOf(name) };
}

const names = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (names.length === 0) {
  console.log("Usage: node scripts/new-champion.mjs <Champion name> [--print]");
  process.exit(1);
}
for (const name of names) {
  const { slug, text } = await draft(name);
  const file = `src/data/${slug}.ts`;
  if (process.argv.includes("--print")) console.log(text);
  else if (existsSync(file)) console.log(`${file} already exists; not overwritten (use --print to see the draft).`);
  else {
    writeFileSync(file, text);
    console.log(`Wrote ${file}. Now check every TODO in it.`);
  }
}
