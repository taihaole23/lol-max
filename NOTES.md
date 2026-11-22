# Project notes

These notes are for anyone joining the project.
- `CLAUDE.md` says what the project is and lists its rules.
- `PLAN.md` is the step-by-step plan for version 1.
- This file keeps a record of the decisions we made and the bugs we fixed.

## Status
- Planning is done.
- Step 0 (project setup) is done: Vite, TypeScript and Vitest are installed, and the page shows a placeholder heading.
- Step 1 (Katarina data) is done: `src/data/patch.ts`, `src/data/katarina.ts` and a test that checks the data for typos.
- Step 2 (dummy presets) is done: `src/data/stages.ts`, `src/data/champions.ts`, `src/data/dummy-presets.ts` and a test.
- Step 3 (core formulas) is done: `src/formulas/` has stats-at-level, raw Death Lotus damage and armor/MR with penetration, each with tests built from the wiki's own examples.
- Step 4 (dagger-by-dagger simulation) is done: `src/simulation/` runs one ult as a timeline of events and adds the results up into breakdowns. Tested with fake items.
- Step 5 (items) is split into 5a snapshot, 5b adding up stats, 5c item checklist, 5d passives.
  - 5a (item snapshot) is done: `scripts/update-items.mjs` → `src/data/items.26.23.json`, read through `src/data/items.ts`.
  - 5b (adding up stats) is done: `src/stats/` turns level + items into Katarina's stats and the dummy's stats, the shapes the simulation takes.
  - 5c (item checklist) is done: item groups in `src/data/item-groups.ts`, the `canBeBuiltTogether` rule in `src/optimizer/legal.ts`, and the checklist at the end of this file (42 items "to model").
  - Next is 5d (item passives).

## Unconfirmed: to check in the Practice Tool (Step 8)
- **When the first dagger lands.** The wiki only says "every 0.166 seconds". We assume 0 s (`firstDaggerSeconds` in `katarina.ts`). It only matters for timed effects near the end of the channel.
- **Whether daggers give Guinsoo's Rageblade stacks** (Seething Strike and Phantom). Daggers trigger "on-attack" effects, but the wiki never says they count for Guinsoo's.
- **Whether R's 25 / 30 / 35% effectiveness also shrinks Terminus's Juxtaposition stacks** (10% pen per Dark stack), or only on-hit *damage* (our assumption). Neither the wiki nor Eric knows.
  - That daggers *do* give Juxtaposition stacks is confirmed by Eric from playing. The wiki only says "basic attacks on-hit".
- **"Deal X% more damage" effects** (damage amplification): whether they apply after armor/MR, and whether two of them add or multiply. The wiki's page for this is gone, and its Damage page says it's out of date.
- **Which on-hit / on-attack effects the daggers really trigger.** The wiki says daggers apply on-hit and on-attack effects, but not whether that includes stack-and-proc effects (Kraken Slayer, Hullbreaker, Heartsteel, Energized items, Dead Man's Plate, Yun Tal's Flurry). Each is marked "Check:" in the item checklist.
  - We assume effects that empower Katarina's next *basic attack* (Spellblade, Sundered Sky, Fiendhunter Bolts) are NOT triggered by daggers, because a dagger isn't a basic attack.

## How to run
You need Node.js (v24 works). In a terminal inside this folder:

| Command | What it does |
|---|---|
| `npm install` | Downloads the tools listed in `package.json` into `node_modules/`. Run it once after cloning. |
| `npm run dev` | Starts the site on your computer. Open the link it prints. The page reloads when you save a file. |
| `npm test` | Runs every test once and shows pass/fail. |
| `npm run test:watch` | Re-runs the tests every time you save. |
| `npm run update-items -- 16.23.1` | Downloads Riot's item data and saves the snapshot `src/data/items.<patch>.json`. The number is Data Dragon's version for our patch. Only needed when the patch changes. |
| `npm run build` | Type-checks the code (`tsc`), then builds the real website into `dist/`. This is what Vercel runs. |

## Project layout (planned)
```
src/
  data/        game numbers, each with a source link and patch
  items/       one file per hand-coded item passive
  ...          formulas, simulation, optimizer, user interface
  optimizer/   which builds are legal; the search itself comes in Step 6
scripts/       update-items.mjs: downloads item data from Data Dragon
tests/         unit tests and the Practice Tool validation test
validation/    Practice Tool test plan and measurements
```

## Decisions (chose X over Y because...)
- **Top 5 builds instead of top 10:** easier to read, and shows enough options.
- **Legendary items only, not components:** keeps the number of combinations and hand-coded passives manageable.
- **Boots in their own slot, controlled by a toggle:** players think "my 3rd item + boots".
  - A build never has more than 6 slots, as in the game, so Full with boots means 5 items + boots.
  - The extra boots slot from the bot-lane role quest is ignored.
- **A mid-quest toggle for tier-3 boots:** the mid role quest upgrades boots, and that changes their stats.
- **Dummies based on real champions (Nami / Illaoi / Sion) instead of made-up numbers:** each value can be traced to the wiki, and "squishy / bruiser / tank" means something concrete.
- **The dummy stays alive at 1 HP:** we want the total damage of the whole ult, not just "enough to kill".
- **Items credited by marginal damage (damage with the item minus damage without it):**
  - This works for multiplying items like Rabadon's.
  - The leftover is shown as an "item interactions" line.
- **Item base stats from saved data instead of typing them in:** fewer typos, and easier to update to a new patch. (First Meraki, then Data Dragon since Step 5a; see "Things we learned".)
- **Legal builds follow the game's item groups, not shared passive names (Step 5c):**
  - The real shop only blocks two items when they share an item group (the wiki's "Limitations"). Rapid Firecannon + Statikk Shiv share the passive name "Energized" but no group, and the game lets you buy both.
  - The old CLAUDE.md wording ("items that share a unique passive can't be combined") would have wrongly blocked such pairs, so it was changed.
  - When two items share a passive name, the passive only counts once. That's handled where the passive is coded (5d).
- **Item groups come from the wiki's item data module, not its "Item group" overview page:** the module is what each item page's "Limitations" section is built from, and all 250 stats we compared in it matched Data Dragon for 26.23. The overview page says it's from V26.12.
- **Runaan's Hurricane is never in a build:** ranged champions only, and Katarina is melee.
- **Mid quest = tier-3 boots, nothing else:** with the toggle on, the optimizer may pick tier-3 boots; with it off, they're not allowed. (Eric, Step 5c.)
- **Rules for item passives (Eric, Step 5c).** These are shown on the site with the other rules:
  - **Item actives don't count.** Clicking an item isn't part of the ability's damage.
  - **Combat starts when R is cast.**
  - **Stacks that fill up on their own are full** when R starts: Rod of Ages (grows each minute), Energized items and Dead Man's Plate (charge while walking).
  - **Stacks you earn by fighting start at 0:** Mejai's, Hubris, Heartsteel's permanent HP, and "per second in combat" stacks like Liandry's and Riftmaker. They can still build up *during* the ult.
  - **Katarina is right next to the dummy** (she usually blinks onto her target before ulting). So aura items like Sunfire Aegis reach it, and Horizon Focus (600+ range) never triggers.
- **Katarina has no mana** (wiki: resource "None"), so mana from items does nothing: Archangel's, Manamune and Winter's Approach passives are irrelevant for her.
- **Four checklist statuses instead of three:** "to model" was added for passives that matter but aren't coded yet, so "not checked yet" only means nobody has read the item.
- **The item filter only removes items whose stats nothing reads:**
  - It's safe because Riftmaker turns HP into AP, so items like Warmog's still count.
  - A test checks that the filter doesn't change the results.
- **Vite + plain TypeScript, no framework:** a small setup that a beginner can read.
- **Vitest instead of Node's built-in test runner:** Vitest reads our TypeScript and Vite settings without extra setup, while Node's runner is stricter about how files import each other. Vitest is only used during development and never ships to the site.
- **Removed the Vite template's demo files (counter, logos, styles):** we didn't need them, and it's less code to read.
- **One `source` per group of numbers, not one per number:** all of a group's numbers come from the same wiki section, so repeating the link would just be noise.
- **The wiki wins when it disagrees with Meraki:** Meraki's Katarina file (marked patch 25.S1.3) gives base armor 28, while the wiki (last changed V26.08) gives 32. We use 32. The wiki is our primary source, and Meraki's champion data was out of date.
  - Same in Step 2: Meraki has Sion's HP growth as 87, while the wiki and Data Dragon say 95.
  - So champion base stats always come from the wiki. Data Dragon is a quick cross-check: it agreed with the wiki on all four champions.
- **Dummy recommended items are stored once, in buy order:** a stage with N items uses boots + the first N. One list per champion instead of four, and every stage is consistent with the next.
  - The dummy always uses the boots-on counts (boots + 1 / 2 / 3 / 5), because Eric's builds include boots and boots like Steelcaps add real armor.
- **Item names, not item IDs, in the presets:** names are readable. Step 5 checks every name against the item data.
- **Sion's permanent HP from his W passive is ignored,** like every champion ability. So a real late-game Sion has more HP than our dummy. Users can type in more HP if they want.
- **Patch numbers:** Riot now numbers patches by year (26.x in 2026). Data Dragon still uses the old style for the same patch: Data Dragon `16.23.1` = patch 26.23. The site uses the 26.x name.

## Things we learned from the data
- **Death Lotus's physical part scales with bonus AD *and* bonus attack speed.** Per dagger: 16% bonus AD × (1 + 3.125 × bonus attack speed). So:
  - The "AD ratio" line in the breakdown is really a *bonus* AD ratio. AD from levels doesn't count.
  - Attack speed items raise R damage even without on-hit. The item filter must keep them.
  - Katarina's per-level attack speed growth counts as bonus attack speed.
- The wiki says Katarina has 10.82% bonus attack speed at level 6, which we can use as a known answer for the stat-growth test in Step 3.
- **Per-level AD growth counts as *base* AD,** so it doesn't add to Death Lotus. Per-level attack speed growth is the one exception: it counts as *bonus* attack speed (wiki, Champion statistic page).
- **Penetration order** (wiki, Armor penetration and Magic penetration pages): flat reduction → % reduction → % penetration (and % bonus penetration) → flat penetration (lethality is 1:1 flat armor pen since V14.1).
  - Only flat reduction can push resist below 0. Once resist is 0 or below, the other steps do nothing.
  - **The wiki contradicts itself** on how flat reduction is split between base and bonus resist. One sentence says "bonus first, then base"; another says "proportionally", and the page's worked example uses proportional. We use proportional, so our tests match the example. Revisit if a Practice Tool test disagrees.
  - Two % reductions (or two % pens) stack multiplicatively: 20% and 30% make 44%, not 50%. Whoever adds up the item stats (Step 5) must combine them this way.
- **The simulation is a timeline (a to-do list sorted by time), not a plain loop over 15 daggers:** some effects happen later than the dagger that caused them (Guinsoo's Phantom Hit lands 0.15 s later, burns tick every 0.5 s). With a timeline, each one lands at its real time, so the channel window rule can be applied exactly.
- **Katarina's stats can change during the ult:** item effects may change them (for example attack speed stacks), and each dagger uses her stats at the moment it's thrown. Runes like Conqueror (version 2) will need the same thing.
- **A tick that lands exactly when the channel ends still counts.**
- **The magic part of a dagger is dealt as two pieces** ("base" and "AP ratio"). MR reduces both by the same share, so the source breakdown can show them separately without any extra math.
- **Item base stats come from Data Dragon, not Meraki:** Meraki's item data disagreed with Riot's current data on 12 legendary stats (e.g. Black Cleaver 40 vs 45 AD). Data Dragon is Riot's own data for the exact patch. A test compares 6 items with the wiki (all matched on 26.23), each chosen to catch a different Data Dragon problem.

- **Adaptive Force isn't handled:** no item Katarina can buy has it on 26.23 (only components and other modes). A test fails if a future patch adds it, and then we add the AD-or-AP rule.
- **R rank comes from the stage's level** (wiki: R is ranked up at 6 / 11 / 16): Early = rank 1, Mid = rank 2, Late and Full = rank 3.
- **Stat-changing passives (Rabadon's...) run after the plain stats are added up,** in one marked spot in `katarina-stats.ts`. They arrive in 5d.

## Data Dragon quirks (found in Step 5a)
- **Its `stats` field leaves out penetration and lethality** (Void Staff shows only 95 AP, no 40% magic pen). The script reads stats from each item's description instead, checks them against `stats` wherever both have a value, and stops on any stat name it doesn't know.
- **Its "available on Summoner's Rift" flag is wrong for some items.** Zephyr is flagged as on the Rift but isn't in the game, and both Thornmail copies (`3075` and `323075`) are flagged. The script keeps the lowest ID per name, and tests pin down known items that must be in or out.
- **It doesn't say which items are legendary.** The script decides by recipe: tier-2 boots are built from Boots, tier-3 boots are built from tier-2 boots (Gunmetal Greaves isn't tagged "Boots"), support items are built from Bounty of Worlds, and every other finished item is a legendary. Riot's tags were no help: Stormsurge is tagged like a support item.
- **A recipe link is missing:** Bounty of Worlds doesn't list World Atlas as its ingredient, which is why the support check uses Bounty of Worlds.
- **It doesn't list item groups** (the "only one of these" rules). Step 5c takes them from each item's wiki page ("Limitations" section). The wiki's Item group overview page says it's outdated (last updated V26.12), so it's only a starting point.
  - Example: Terminus is in **Blight** (with Void Staff, Cryptbloom, Bloodletter's Curse) and **Fatality** (with Black Cleaver, Lord Dominik's, Mortal Reminder, Serylda's). Eric caught this: Void Staff + Terminus can't be built together.
  - Groups don't apply to recipe upgrades: Void Staff can be built from Blighting Jewel even though both are Blight.
- **Exact names matter:** it's "Blade of The Ruined King" with a capital T. `getItem()` throws on unknown names, so typos fail loudly.

- **The dummy gets items, chosen from real legendaries, not made-up defensive numbers:**
  - A dummy = champion + level + items. Every number traces back to the wiki or the item data, and a late-game Sion is as tanky as a real one.
  - A "Use recommended items" checkbox (on by default) gives a recommended list per champion and stage, so users don't have to hunt for tank items. Unchecked, users pick the items themselves.
  - Only plain HP / armor / MR count, no item passives, the same way champion abilities are ignored.
  - Typed-in HP / armor / MR still override everything, for "what if" questions.

## Ideas for version 2
- Runes.
- Any champion as the dummy. The code is built so this only needs data, but every champion's base stats must be checked against the wiki, since Meraki's champion data can be out of date.

## Still open
None right now.

## Bugs (bug / cause / fix)
None yet.

## Item checklist
Every legendary and boots item in the snapshot, checked in Step 5c against the wiki (patch 26.23).
A test (`tests/item-checklist.test.ts`) fails if an item is missing from these tables or has an unknown status.

**What this checks:** only an item's *passive*. Every item's plain stats (AP, AD, HP, pen…) are already counted by `src/stats/`.
The question for each item is: does its passive change Death Lotus damage on one dummy during one channel, under our rules (see "Rules for item passives" in Decisions)?

**Statuses:**
- **modelled**: the passive is coded in `src/items/` and has a test.
- **to model**: the passive matters (or might), so Step 5d codes it. "Check:" marks a question 5d must answer first.
- **checked, irrelevant**: the passive can't change R's damage. The reason is given.
- **not checked yet**: nobody has read it yet. A new item on a future patch starts here.

Source for every row: the item's wiki page, read through the wiki's item data module (https://wiki.leagueoflegends.com/en-us/Module:ItemData/data).

### Tier-2 boots
| Item | Status | Why |
|---|---|---|
| Berserker's Greaves | checked, irrelevant | No passive. Its attack speed stat counts (raises R's physical part). |
| Boots of Swiftness | checked, irrelevant | Slow resist. |
| Gluttonous Greaves | checked, irrelevant | Needs takedowns. |
| Ionian Boots of Lucidity | checked, irrelevant | Summoner spell haste. |
| Mercury's Treads | checked, irrelevant | No passive. |
| Plated Steelcaps | checked, irrelevant | Reduces damage Katarina takes. |
| Sorcerer's Shoes | checked, irrelevant | No passive. Its magic pen stat counts. |

### Tier-3 boots (mid quest toggle on)
| Item | Status | Why |
|---|---|---|
| Armored Advance | checked, irrelevant | Shield when Katarina takes damage. |
| Chainlaced Crushers | checked, irrelevant | Shield when Katarina takes damage. |
| Crimson Lucidity | checked, irrelevant | Summoner haste and move speed. |
| Gunmetal Greaves | checked, irrelevant | No passive. Its stats count. |
| Immortal Path | to model | "Now and Forever": 4% increased damage while above 50% HP. The dummy never hits back, so it's always on. |
| Spellslinger's Shoes | checked, irrelevant | No passive. Its stats count. |
| Swiftmarch | to model | "Noxian Fervor": adaptive force = 5% of total move speed. Needs Katarina's base move speed (wiki: 335) and the adaptive AD-or-AP rule. |

### Legendary items
| Item | Status | Why |
|---|---|---|
| Abyssal Mask | to model | "Unmake": the dummy takes 12% more magic damage (after MR). Katarina is next to it. |
| Actualizer | checked, irrelevant | Active only. |
| Archangel's Staff | checked, irrelevant | AP from mana, but Katarina has no mana (wiki: resource "None"). Its AP stat counts. |
| Ardent Censer | checked, irrelevant | Needs healing allies. |
| Axiom Arc | checked, irrelevant | Needs takedowns. |
| Bandlepipes | checked, irrelevant | Needs slows / immobilizes, gives move speed. |
| Banshee's Veil | checked, irrelevant | Defensive. |
| Bastionbreaker | to model | "Shaped Charge": the first ability damage instance deals bonus true damage (40 + 1.5 per lethality for melee), 20 s cooldown. |
| Black Cleaver | to model | "Carve": physical damage gives armor reduction stacks (6% each, up to 30%). |
| Blackfire Torch | to model | Burn on ability damage (only the part inside the channel counts) + 4% AP while the dummy burns. |
| Blade of The Ruined King | to model | On-hit physical damage based on the dummy's current HP (1 HP after the overkill point). |
| Bloodletter's Curse | to model | "Vile Decay": magic damage from an ability gives MR reduction stacks (up to 30%). |
| Bloodthirster | checked, irrelevant | Shield. |
| Chempunk Chainsword | checked, irrelevant | Grievous Wounds; the dummy doesn't heal. |
| Cosmic Drive | checked, irrelevant | Move speed. |
| Cryptbloom | checked, irrelevant | Needs takedowns. Its pen stat counts. |
| Dawncore | to model | AP per 100% base mana regen. Check: does it work on a champion with no mana? |
| Dead Man's Plate | to model | Momentum is full at R cast (from walking). Check: do daggers consume it like a basic attack? |
| Death's Dance | checked, irrelevant | Defensive. |
| Dusk and Dawn | checked, irrelevant | Spellblade: empowers Katarina's next *basic attack*. Daggers aren't basic attacks. |
| Echoes of Helia | checked, irrelevant | Needs healing allies. |
| Eclipse | to model | Bonus damage after 2 stacks from different cast instances within 2 s. Check: R is one cast instance; do its burns or item effects count as separate ones? |
| Edge of Night | checked, irrelevant | Defensive. |
| Endless Hunger | checked, irrelevant | Needs takedowns. |
| Essence Reaver | checked, irrelevant | Spellblade (basic attacks only). |
| Experimental Hexplate | to model | "Overdrive": casting R gives 50% bonus attack speed (melee) for 8 s, which raises R's physical part. |
| Fiendhunter Bolts | checked, irrelevant | Empowers basic attacks after R. |
| Force of Nature | checked, irrelevant | Defensive. |
| Frozen Heart | checked, irrelevant | Defensive. |
| Guardian Angel | checked, irrelevant | Defensive. |
| Guinsoo's Rageblade | to model | On-hit 30 magic damage, plus on-attack attack speed stacks and Phantom hits. Check: see "Unconfirmed". |
| Heartsteel | to model | Stacks build up each second near the dummy (starting at 0), then an on-hit proc. Check: do daggers trigger the proc? Permanent HP stacks start at 0. |
| Hexoptics C44 | checked, irrelevant | Increases *basic attack* damage only. |
| Hextech Gunblade | checked, irrelevant | Active only. |
| Hextech Rocketbelt | checked, irrelevant | Active only. |
| Hollow Radiance | to model | "Immolate" aura: magic damage every second near Katarina, scales with bonus HP. |
| Horizon Focus | checked, irrelevant | Needs 600+ range; R's daggers only reach 550. |
| Hubris | checked, irrelevant | Needs takedowns (starts at 0 stacks). |
| Hullbreaker | to model | On-hit stacks, proc at max stacks. Check: do daggers count? |
| Iceborn Gauntlet | checked, irrelevant | Spellblade (basic attacks only). |
| Immortal Shieldbow | checked, irrelevant | Defensive. |
| Imperial Mandate | checked, irrelevant | Needs an immobilize; R has none. |
| Infinity Edge | checked, irrelevant | No passive. Crit stats do nothing: abilities and on-hit can't crit. |
| Jak'Sho, The Protean | checked, irrelevant | Defensive. |
| Kaenic Rookern | checked, irrelevant | Defensive. |
| Knight's Vow | checked, irrelevant | Needs an ally. |
| Kraken Slayer | to model | On-attack stacks (starting at 0), proc at 2 stacks. Check: do daggers count? |
| Liandry's Torment | to model | Burn on ability damage (only inside the channel) + "Suffering": 2% more damage per second in combat, starting at 0 when R is cast. |
| Lich Bane | checked, irrelevant | Spellblade (basic attacks only). |
| Locket of the Iron Solari | checked, irrelevant | Active only. |
| Lord Dominik's Regards | to model | "Giant Slayer": more damage the more max HP the dummy has than Katarina. |
| Luden's Echo | to model | "Echo": ability damage fires bonus magic damage. Check: with only one enemy, how many of the 6 stacks hit it? |
| Malignance | to model | "Hatefog": R damage makes a zone that deals magic damage and reduces MR. |
| Manamune | checked, irrelevant | AD from mana, but Katarina has no mana. Its AD stat counts. |
| Maw of Malmortius | checked, irrelevant | Defensive. |
| Mejai's Soulstealer | checked, irrelevant | Stacks come from kills, so 0 stacks. Its plain AP stat counts. |
| Mercurial Scimitar | checked, irrelevant | Active only. |
| Mikael's Blessing | checked, irrelevant | Active only. |
| Moonstone Renewer | checked, irrelevant | Needs healing allies. |
| Morellonomicon | checked, irrelevant | Grievous Wounds; the dummy doesn't heal. |
| Mortal Reminder | checked, irrelevant | Grievous Wounds. Its armor pen stat counts. |
| Nashor's Tooth | to model | On-hit magic damage. |
| Navori Flickerblade | checked, irrelevant | Lowers cooldowns of basic abilities. |
| Overlord's Bloodmail | to model | "Tyranny": bonus AD from bonus HP (a stat conversion). "Retribution" is 0 at full HP. |
| Phantom Dancer | checked, irrelevant | Ghosting. |
| Profane Hydra | checked, irrelevant | Cleave hits only *other* enemies; active doesn't count. |
| Protoplasm Harness | checked, irrelevant | Defensive. |
| Rabadon's Deathcap | to model | "Magical Opus": +30% AP. |
| Randuin's Omen | checked, irrelevant | Defensive. |
| Rapid Firecannon | to model | Energized (full at R cast): on-hit 40 magic damage. Check: do daggers build Energize stacks? |
| Ravenous Hydra | checked, irrelevant | Cleave hits only other enemies. |
| Redemption | checked, irrelevant | Active only. |
| Riftmaker | to model | AP from bonus HP (stat conversion) + 2% more damage per second in combat, starting at 0 when R is cast. |
| Rod of Ages | to model | "Timeless" is full (grows with time): +100 HP, +30 AP, and +1 level. Check: does the extra level change Katarina's stats at our stage levels? |
| Runaan's Hurricane | checked, irrelevant | Ranged champions only; Katarina can't buy it (in `katarinaCannotBuy`). |
| Rylai's Crystal Scepter | checked, irrelevant | Slow. |
| Serpent's Fang | checked, irrelevant | Reduces shields; the dummy has none. |
| Serylda's Grudge | checked, irrelevant | Slow. Its pen stat counts. |
| Shadowflame | to model | "Cinderbloom": magic and true damage crit for 120% against targets below 40% HP. |
| Shurelya's Battlesong | checked, irrelevant | Active only. |
| Spear of Shojin | to model | "Focused Will": 3% more ability damage per stack. Check: how many stacks one R cast gives. |
| Spirit Visage | checked, irrelevant | Defensive. |
| Staff of Flowing Water | checked, irrelevant | Needs healing allies. |
| Statikk Shiv | to model | Energized (full at R cast): chain lightning 60 magic damage on-hit. Check: do daggers build Energize stacks? |
| Sterak's Gage | to model | "The Claws that Catch": bonus AD = 50% of base AD, which counts for R. |
| Stormrazor | to model | Energized (full at R cast): 100 magic damage on-hit. |
| Stormsurge | to model | Deal 25% of the dummy's max HP within 2.5 s → lightning strike 2 s later (may land inside the channel). |
| Stridebreaker | checked, irrelevant | Cleave hits only other enemies; active doesn't count. |
| Sundered Sky | checked, irrelevant | Empowers the next *basic attack*. |
| Sunfire Aegis | to model | "Immolate" aura: magic damage every second near Katarina. |
| Terminus | to model | On-hit magic damage + "Juxtaposition" pen stacks. Check: see "Unconfirmed". |
| The Collector | checked, irrelevant | Execute below 5% HP; under our overkill rule the dummy never dies. Its lethality stat counts. |
| Thornmail | checked, irrelevant | Reflects damage Katarina takes. Its HP stat counts (Riftmaker). |
| Titanic Hydra | to model | "Cleave": on-hit bonus physical damage to the target, scales with max HP. |
| Trinity Force | checked, irrelevant | Spellblade (basic attacks only) + move speed. |
| Umbral Glaive | checked, irrelevant | Needs Katarina unseen; Death Lotus reveals her. |
| Unending Despair | to model | Sap: magic damage every 4 s in combat. Check: does the first sap happen right away? |
| Void Staff | checked, irrelevant | No passive. Its 40% magic pen stat counts. |
| Voltaic Cyclosword | to model | Energized (full at R cast) + "Galvanize": ability damage triggers the Energized hit. |
| Warmog's Armor | to model | "Warmog's Vitality": +12% bonus HP from items (a stat conversion; matters with Riftmaker etc.). |
| Winter's Approach | checked, irrelevant | HP from mana, but Katarina has no mana. |
| Wit's End | to model | On-hit 45 magic damage. |
| Youmuu's Ghostblade | checked, irrelevant | Move speed; active doesn't count. |
| Yun Tal Wildarrows | to model | "Flurry": 30% attack speed when launching a basic attack. Check: do daggers trigger it? (Its crit stacks don't matter.) |
| Zeke's Convergence | to model | Casting R summons a storm that damages the dummy (Katarina is next to it). |
| Zhonya's Hourglass | checked, irrelevant | Active only. |
