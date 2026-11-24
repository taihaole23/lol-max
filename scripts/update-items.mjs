// Downloads Riot's item list (Data Dragon) and saves the items we need as a snapshot.
// The site only ever reads the saved snapshot, never the internet.
//
// Usage:  node scripts/update-items.mjs 16.23.1
// The argument is Data Dragon's version name for our patch (Data Dragon 16.23.1 = patch 26.23).
//
// Why we read stats from each item's description text, not its `stats` field:
// the `stats` field leaves out penetration and lethality (Void Staff shows only its AP).
// The description lists every stat. Where both have a value, this script checks they agree.
import { readFileSync, writeFileSync } from "node:fs";

const ddragonVersion = process.argv[2];
if (!ddragonVersion) {
  throw new Error("Give the Data Dragon version, e.g.: node scripts/update-items.mjs 16.23.1");
}

// The site's patch, read from src/data/patch.ts so the two can't disagree.
const patch = readFileSync("src/data/patch.ts", "utf8").match(/PATCH\s*=\s*"([^"]+)"/)[1];

const url = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/data/en_US/item.json`;
const all = (await (await fetch(url)).json()).data;

// Every final support item (Dream Maker, Bloodsong...) is built from Bounty of Worlds.
// (Its own recipe should go back to World Atlas, but Data Dragon leaves that link out.)
const BOUNTY_OF_WORLDS = "3867";

// Stat names as written in the descriptions → our names. Percentages become fractions (40% → 0.4).
// Any name not listed here stops the script, so a new stat is never dropped silently.
const STAT_NAMES = {
  "Ability Power": "abilityPower",
  "Attack Damage": "attackDamage",
  "% Attack Speed": "attackSpeed",
  "Health": "health",
  "Armor": "armor",
  "Magic Resist": "magicResist",
  "Lethality": "lethality",
  "Magic Penetration": "flatMagicPenetration",
  "% Magic Penetration": "percentMagicPenetration",
  "% Armor Penetration": "percentArmorPenetration",
  "Adaptive Force": "adaptiveForce",
  "Mana": "mana",
  "Ability Haste": "abilityHaste",
  "% Critical Strike Chance": "critChance",
  "% Critical Strike Damage": "critDamage",
  "% Life Steal": "lifeSteal",
  "% Omnivamp": "omnivamp",
  "Move Speed": "moveSpeed",
  "% Move Speed": "percentMoveSpeed",
  "% Heal and Shield Power": "healAndShieldPower",
  "% Tenacity": "tenacity",
  "% Base Health Regen": "baseHealthRegen",
  "% Base Mana Regen": "baseManaRegen",
  "Gold Per 10 Seconds": "goldPer10",
};

// Data Dragon's `stats` field names → our names, used only for the cross-check.
const STATS_FIELD_NAMES = {
  FlatHPPoolMod: "health",
  FlatArmorMod: "armor",
  FlatSpellBlockMod: "magicResist",
  FlatMagicDamageMod: "abilityPower",
  FlatPhysicalDamageMod: "attackDamage",
  PercentAttackSpeedMod: "attackSpeed",
  FlatCritChanceMod: "critChance",
  PercentLifeStealMod: "lifeSteal",
  FlatMovementSpeedMod: "moveSpeed",
  PercentMovementSpeedMod: "percentMoveSpeed",
  FlatMPPoolMod: "mana",
};

function parseStats(item) {
  const block = item.description.match(/<stats>(.*?)<\/stats>/)?.[1] ?? "";
  const stats = {};
  for (const line of block.split(/<br\s*\/?>/i)) {
    const text = line.replace(/<[^>]+>/g, "").trim();
    if (!text) continue;
    const match = text.match(/^([\d.]+)(%?)\s+(.+)$/);
    const name = match && STAT_NAMES[match[2] + (match[2] ? " " : "") + match[3]];
    if (!name) throw new Error(`Unknown stat line "${text}" on ${item.name}. Add it to STAT_NAMES.`);
    stats[name] = match[2] ? Number(match[1]) / 100 : Number(match[1]);
  }
  for (const [field, value] of Object.entries(item.stats)) {
    const name = STATS_FIELD_NAMES[field];
    if (name && Math.abs((stats[name] ?? 0) - value) > 1e-9) {
      throw new Error(`${item.name}: description says ${name} = ${stats[name]}, stats field says ${value}.`);
    }
  }
  return stats;
}

// The item's passives and actives as plain text, for the site's item tooltip (display only: the
// math never reads this; passives that matter are hand-coded in src/items/).
// Description shape: <stats>...</stats> then "<passive>Name</passive><br>text..." per effect.
function parseEffects(item) {
  const body = item.description.replace(/<stats>.*?<\/stats>/s, "");
  const effects = [];
  const pattern = /<(passive|active)>(.*?)<\/\1>(.*?)(?=<(?:passive|active)>|<\/mainText>|$)/gs;
  for (const [, kind, name, rest] of body.matchAll(pattern)) {
    const text = rest.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    effects.push({ kind, name: name.replace(/<[^>]+>/g, "").trim(), text });
  }
  return effects;
}

// Is this item built (directly or further down its recipe) from `targetId`?
function builtFrom(item, targetId) {
  return (item.from ?? []).some((id) => id === targetId || (all[id] && builtFrom(all[id], targetId)));
}

const isTier2Boots = (item) => (item.from ?? []).includes("1001") && (item.tags ?? []).includes("Boots");

function category(item) {
  if (isTier2Boots(item)) return "boots";
  if ((item.from ?? []).some((id) => all[id] && isTier2Boots(all[id]))) return "boots-tier-3";
  if (item.into || !item.from) return null; // components and starter items
  if (builtFrom(item, BOUNTY_OF_WORLDS)) return "support";
  return "legendary";
}

// Items Data Dragon offers on Summoner's Rift. Some appear more than once
// (other game modes' versions); for each name we keep the lowest ID.
const items = [];
const seen = new Set();
const ids = Object.keys(all).sort((a, b) => Number(a) - Number(b));
for (const id of ids) {
  const item = all[id];
  if (!item.maps["11"] || !item.gold.purchasable || item.inStore === false) continue;
  if (item.requiredChampion || item.hideFromAll || item.consumed) continue;
  if (seen.has(item.name)) continue;
  const cat = category(item);
  if (!cat) continue;
  seen.add(item.name);
  items.push({ id, name: item.name, category: cat, gold: item.gold.total, stats: parseStats(item), effects: parseEffects(item) });
}
items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

const snapshot = { source: url, ddragonVersion, patch, items };
const outFile = `src/data/items.${patch}.json`;
writeFileSync(outFile, JSON.stringify(snapshot, null, 2) + "\n");

const counts = {};
for (const item of items) counts[item.category] = (counts[item.category] ?? 0) + 1;
console.log(`Saved ${items.length} items to ${outFile}:`, counts);
