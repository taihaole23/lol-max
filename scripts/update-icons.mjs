// Downloads Riot's icons (Data Dragon) and the champion list, and saves them in the project.
// The site only uses the saved copies, never Riot's servers while running.
//
// Usage:  node scripts/update-icons.mjs 16.23.1
// Use the same Data Dragon version as update-items.mjs, and run update-items first: the item
// icons are the ones in the item snapshot.
//
// Saves:
//   src/data/champion-list.<patch>.json   every champion's name (for the search bar) and the
//                                         theme colour picked from their splash art
//   public/icons/champion/<slug>.png      every champion's square icon
//   public/icons/ability/<slug>-<q|w|e|r>.png   every champion's 4 ability icons
//   public/icons/item/<item id>.png       every item in the item snapshot
// Vite serves the public/ folder as it is, so the page shows them as /icons/...
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { addSplashColors } from "./splash-colors.mjs";

const ddragonVersion = process.argv[2];
if (!ddragonVersion) {
  throw new Error("Give the Data Dragon version, e.g.: node scripts/update-icons.mjs 16.23.1");
}

const patch = readFileSync("src/data/patch.ts", "utf8").match(/PATCH\s*=\s*"([^"]+)"/)[1];
const cdn = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}`;

// A champion's name as used in web addresses: lowercase letters and digits only.
// "Kai'Sa" → "kaisa", "Nunu & Willump" → "nunuwillump", "Wukong" → "wukong".
const slugOf = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  return response.json();
}

async function saveFile(url, path) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} for ${url}`);
  writeFileSync(path, Buffer.from(await response.arrayBuffer()));
}

// Runs `jobs` a few at a time, so we don't send Riot's server hundreds of requests at once.
async function inBatches(jobs, size = 8) {
  for (let i = 0; i < jobs.length; i += size) {
    await Promise.all(jobs.slice(i, i + size).map((job) => job()));
  }
}

for (const folder of ["champion", "ability", "item"]) mkdirSync(`public/icons/${folder}`, { recursive: true });

// --- Champions: the list, their icons and their ability icons ---
const championUrl = `${cdn}/data/en_US/champion.json`;
const championData = Object.values((await getJson(championUrl)).data);
const champions = championData
  .map((c) => ({ slug: slugOf(c.name), name: c.name, ddragonId: c.id, riotKey: Number(c.key) }))
  .sort((a, b) => a.name.localeCompare(b.name));

const slugs = new Set(champions.map((c) => c.slug));
if (slugs.size !== champions.length) throw new Error("Two champions got the same slug. Change slugOf.");

// Each champion's 4 abilities: icon, name and number of ranks (for the page's ability bar).
// Only names and rank counts are kept from Data Dragon: its ability NUMBERS are unreliable.
const abilityKeys = ["q", "w", "e", "r"];
mkdirSync("public/icons/splash", { recursive: true });

// --- Splash art: one of the champion's best skins (Eric), not the default one. ---
// Data Dragon lists the skins but not how fancy they are. CommunityDragon (a community copy of
// the game's own files) has each skin's tier, so the pick is automatic:
//   highest tier first (Ultimate / Exalted / Transcendent, then Mythic = Prestige, Legendary,
//   Epic...), and the newest skin among equals.
// To choose a different skin for a champion, add it here: slug → skin number (the "num" in Data
// Dragon's skin list; e.g. Battle Queen Katarina is 29).
const splashOverrides = {
  katarina: 29, // Battle Queen Katarina (Eric)
};
const skinTierUrl = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/skins.json";
const skinTiers = await getJson(skinTierUrl); // { "55060": { name, rarity, ... } }; id = champion key × 1000 + skin number
const tierRank = { kUltimate: 6, kExalted: 6, kTranscendent: 6, kMythic: 5, kLegendary: 4, kEpic: 3, kRare: 2 };

// The skins to try, best first, always ending with the default skin (0).
function splashCandidates(c, skins) {
  const ranked = skins
    .filter((s) => s.num !== 0)
    .map((s) => ({ ...s, rank: tierRank[skinTiers[c.riotKey * 1000 + s.num]?.rarity] ?? 1 }))
    .sort((a, b) => b.rank - a.rank || b.num - a.num);
  const override = skins.find((s) => s.num === splashOverrides[c.slug]);
  return [...(override ? [override] : []), ...ranked.slice(0, 3), skins.find((s) => s.num === 0)];
}

// "centered" is Riot's crop for wide banners (~135 KB). Some skins only have the normal splash,
// and a few have neither: then the next candidate is tried.
const missingSplashes = [];
async function saveSplash(c, skins) {
  for (const skin of splashCandidates(c, skins)) {
    for (const kind of ["centered", "splash"]) {
      try {
        await saveFile(`https://ddragon.leagueoflegends.com/cdn/img/champion/${kind}/${c.ddragonId}_${skin.num}.jpg`, `public/icons/splash/${c.slug}.jpg`);
        return { skin: skin.num === 0 ? c.name : skin.name, num: skin.num };
      } catch {
        // try the next kind, then the next skin
      }
    }
  }
  missingSplashes.push(c.name);
  return null;
}
await inBatches(
  champions.map((c) => async () => {
    await saveFile(`${cdn}/img/champion/${c.ddragonId}.png`, `public/icons/champion/${c.slug}.png`);
    const details = (await getJson(`${cdn}/data/en_US/champion/${c.ddragonId}.json`)).data[c.ddragonId];
    if (details.spells.length !== 4) throw new Error(`${c.name} has ${details.spells.length} abilities, not 4.`);
    c.abilities = details.spells.map((spell, i) => ({ key: abilityKeys[i], name: spell.name, maxRank: spell.maxrank }));
    c.splash = await saveSplash(c, details.skins);
    delete c.riotKey; // only needed to look up skin tiers
    await Promise.all(
      details.spells.map((spell, i) =>
        saveFile(`${cdn}/img/spell/${spell.image.full}`, `public/icons/ability/${c.slug}-${abilityKeys[i]}.png`),
      ),
    );
  }),
);

const listFile = `src/data/champion-list.${patch}.json`;
writeFileSync(listFile, JSON.stringify({ source: championUrl, skinTierSource: skinTierUrl, ddragonVersion, patch, champions }, null, 2) + "\n");
// Each champion page's theme colour, picked from the splash art just saved (splash-colors.mjs).
// Same run, same pictures: the colours can never belong to an older splash.
addSplashColors(listFile);

// --- Items: every item in the snapshot ---
const itemSnapshot = JSON.parse(readFileSync(`src/data/items.${patch}.json`, "utf8"));
if (itemSnapshot.ddragonVersion !== ddragonVersion) {
  throw new Error(`The item snapshot is from ${itemSnapshot.ddragonVersion}; run update-items.mjs ${ddragonVersion} first.`);
}
await inBatches(itemSnapshot.items.map((item) => () => saveFile(`${cdn}/img/item/${item.id}.png`, `public/icons/item/${item.id}.png`)));

// --- The gold coin shown next to build prices. Data Dragon stopped publishing UI icons after
// patch 5.x, so this one comes from an old version; it hasn't changed in-game. ---
mkdirSync("public/icons/ui", { recursive: true });
await saveFile("https://ddragon.leagueoflegends.com/cdn/5.5.1/img/ui/gold.png", "public/icons/ui/gold.png");

if (missingSplashes.length) console.warn(`No splash art found for: ${missingSplashes.join(", ")}`);
console.log(`Saved ${champions.length} champions (icons + 4 ability icons each) and ${itemSnapshot.items.length} item icons.`);
console.log(`Champion list: ${listFile}`);
