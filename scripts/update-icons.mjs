// Downloads Riot's icons (Data Dragon) and the champion list, and saves them in the project.
// The site only uses the saved copies, never Riot's servers while running.
//
// Usage:  node scripts/update-icons.mjs 16.23.1
// Use the same Data Dragon version as update-items.mjs, and run update-items first: the item
// icons are the ones in the item snapshot.
//
// Saves:
//   src/data/champion-list.<patch>.json   every champion's name (for the search bar)
//   public/icons/champion/<slug>.png      every champion's square icon
//   public/icons/ability/<slug>-<q|w|e|r>.png   every champion's 4 ability icons
//   public/icons/item/<item id>.png       every item in the item snapshot
// Vite serves the public/ folder as it is, so the page shows them as /icons/...
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

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
  .map((c) => ({ slug: slugOf(c.name), name: c.name, ddragonId: c.id }))
  .sort((a, b) => a.name.localeCompare(b.name));

const slugs = new Set(champions.map((c) => c.slug));
if (slugs.size !== champions.length) throw new Error("Two champions got the same slug. Change slugOf.");

const abilityKeys = ["q", "w", "e", "r"];
await inBatches(
  champions.map((c) => async () => {
    await saveFile(`${cdn}/img/champion/${c.ddragonId}.png`, `public/icons/champion/${c.slug}.png`);
    const details = (await getJson(`${cdn}/data/en_US/champion/${c.ddragonId}.json`)).data[c.ddragonId];
    if (details.spells.length !== 4) throw new Error(`${c.name} has ${details.spells.length} abilities, not 4.`);
    await Promise.all(
      details.spells.map((spell, i) =>
        saveFile(`${cdn}/img/spell/${spell.image.full}`, `public/icons/ability/${c.slug}-${abilityKeys[i]}.png`),
      ),
    );
  }),
);

const listFile = `src/data/champion-list.${patch}.json`;
writeFileSync(listFile, JSON.stringify({ source: championUrl, ddragonVersion, patch, champions }, null, 2) + "\n");

// --- Items: every item in the snapshot ---
const itemSnapshot = JSON.parse(readFileSync(`src/data/items.${patch}.json`, "utf8"));
if (itemSnapshot.ddragonVersion !== ddragonVersion) {
  throw new Error(`The item snapshot is from ${itemSnapshot.ddragonVersion}; run update-items.mjs ${ddragonVersion} first.`);
}
await inBatches(itemSnapshot.items.map((item) => () => saveFile(`${cdn}/img/item/${item.id}.png`, `public/icons/item/${item.id}.png`)));

// --- Splash art behind the champion page's header: only for champions the site supports, since
// each is ~135 KB. Keep this list in step with src/data/playable-champions.ts (a test checks).
// "centered" is Riot's version cropped for wide banners; it has no patch number in its address. ---
const splashChampions = ["katarina"];
mkdirSync("public/icons/splash", { recursive: true });
for (const slug of splashChampions) {
  const champion = champions.find((c) => c.slug === slug);
  await saveFile(`https://ddragon.leagueoflegends.com/cdn/img/champion/centered/${champion.ddragonId}_0.jpg`, `public/icons/splash/${slug}.jpg`);
}

// --- The gold coin shown next to build prices. Data Dragon stopped publishing UI icons after
// patch 5.x, so this one comes from an old version; it hasn't changed in-game. ---
mkdirSync("public/icons/ui", { recursive: true });
await saveFile("https://ddragon.leagueoflegends.com/cdn/5.5.1/img/ui/gold.png", "public/icons/ui/gold.png");

console.log(`Saved ${champions.length} champions (icons + 4 ability icons each) and ${itemSnapshot.items.length} item icons.`);
console.log(`Champion list: ${listFile}`);
