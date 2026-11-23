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
  - 5c (item checklist) is done: item groups in `src/data/item-groups.ts`, the `canBeBuiltTogether` rule in `src/optimizer/legal.ts`, and the checklist at the end of this file (47 items "to model" after Eric's Spellblade correction; 40 after 5d-1).
  - 5d (item passives) is split by the kind of code each item needs:
    - 5d-1 stat passives is done: Rabadon's, Riftmaker HP → AP, Warmog's, Overlord's, Sterak's, Rod of Ages, Swiftmarch in `src/items/`, run by `katarina-stats.ts`. Dawncore turned out irrelevant.
    - 5d-2 plain on-hit + Spellblade is done: Nashor's, Wit's End, Guinsoo's 30 magic, Terminus Shadow, BotRK, Titanic Hydra and the 5 Spellblade items. `src/simulation/simulate-build.ts` runs a whole build (stats + effects + simulation). 31 items left "to model".
    - 5d-3 resist shred is done: Black Cleaver, Bloodletter's, Malignance (zone damage + −10 MR), Terminus Juxtaposition. 27 items left "to model".
    - 5d-4 damage amps is done: Immortal Path, Abyssal Mask, Liandry's Suffering, Riftmaker Void Corruption, Lord Dominik's, Shadowflame, Spear of Shojin. 21 items left "to model".
    - Next is 5d-5 burns, auras and timed effects (Liandry's burn, Blackfire, Sunfire, Hollow Radiance, Unending Despair, Zeke's, Stormsurge, Bastionbreaker, Luden's, Hexplate, Eclipse)
    - 5d-6 stack-then-proc (Guinsoo's stacks, Kraken, Hullbreaker, Heartsteel, Rapid Firecannon, Statikk, Stormrazor, Voltaic, Dead Man's Plate, Yun Tal)

## Unconfirmed: to check in the Practice Tool (Step 8)
- **When the first dagger lands.** The wiki only says "every 0.166 seconds". We assume 0 s (`firstDaggerSeconds` in `katarina.ts`). It only matters for timed effects near the end of the channel.
- **Whether daggers give Guinsoo's Rageblade stacks** (Seething Strike and Phantom). Daggers trigger "on-attack" effects, but the wiki never says they count for Guinsoo's. Eric, from playing: they trigger the Phantom hit.
- **Within one dagger, R's own damage lands before on-hit effects** (our assumption). Only matters for BotRK, which reads the dummy's current HP.
- **Whether R's 25 / 30 / 35% effectiveness also shrinks Terminus's Juxtaposition stacks** (10% pen per Dark stack), or only on-hit *damage* (our assumption). Neither the wiki nor Eric knows.
  - That daggers *do* give Juxtaposition stacks is confirmed by Eric from playing. The wiki only says "basic attacks on-hit".
  - **Whether the first Juxtaposition hit is Light or Dark.** We assume Light (Dark = 2nd, 4th, 6th hit), the safer guess.
- **Malignance's tick timing.** We assume the first tick lands 0.25 s after the zone appears (12 ticks over 3 s = the wiki's "180 total"), so 10 ticks fall inside the channel. If the zone ticks right away, it's 11.
- **Bloodletter's Curse stacks only from R's own magic damage,** not from items' on-hit magic damage (our assumption: on-hit damage is item damage, not ability damage).
- **Black Cleaver: R's hit benefits from its own stack.** The wiki says so (listed as a bug) for non-basic damage. If it's been fixed, dagger N has N − 1 stacks instead of N.
- **"Deal X% more damage" effects** (damage amplification): we apply them after armor/MR and multiply them together. Sources: the wiki's Damage page ("percent damage modifiers stack multiplicatively"), Liandry's page (its bonus "stacks multiplicatively with other damage multipliers") and Shadowflame's worked examples. Still worth one Practice Tool check (e.g. Abyssal Mask + Immortal Path).
- **"Per second in combat" stacks (Liandry's, Riftmaker) come at exactly 1 s and 2 s after R is cast** (our assumption).
- **Spear of Shojin boosts only R's own damage,** not on-hit item damage from the daggers (our assumption; the wiki's "proc damage from your ability" is unclear about on-hit).
- **Which on-hit / on-attack effects the daggers really trigger.** The wiki says daggers apply on-hit and on-attack effects, but not whether that includes stack-and-proc effects (Kraken Slayer, Hullbreaker, Heartsteel, Energized items, Dead Man's Plate, Yun Tal's Flurry).
  - **Eric, from playing:** daggers DO trigger Kraken Slayer's proc, Energized items (e.g. Statikk Shiv) and Guinsoo's Phantom hit. We model them that way, and the Practice Tool confirms it.
  - **Eric, from playing:** daggers trigger **Spellblade** (Lich Bane, Trinity Force...), but only on the **first** dagger. It doesn't proc again during the ult.
    - Still unknown: is the Spellblade hit reduced by R's 25 / 30 / 35% like other on-hit damage? **We assume yes** (the wiki calls it on-hit damage; Eric thinks so too).
  - **Dusk and Dawn** (our assumption, from its wiki text; Eric thinks "maybe"): the first dagger's Spellblade also re-applies every on-hit effect 0.2 s later, at R's effectiveness. The wiki lists a bug that changes the repeated hits' damage type; we ignore it because the note is unclear.
  - We assume Sundered Sky and Fiendhunter Bolts (which empower Katarina's next *basic attack*) are NOT triggered by daggers. Hullbreaker, Heartsteel, Dead Man's Plate and Yun Tal stay marked "Check:" in the item checklist.

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
- **Each item file keeps its numbers in a `data` object at the top, with a source and patch (Step 5d):** the same rule as the data files (no magic numbers in formulas), but next to the only code that uses them, so one file tells the whole story of an item.
- **Stat passives run in four fixed steps (Step 5d-1):** add HP → convert (HP → AP / AD) → adaptive force → multiply (Rabadon's). Why this order, from the wiki:
  - Riftmaker and Overlord's use ALL bonus HP, so HP-adding passives (Warmog's, Rod of Ages) must come first.
  - Adaptive force picks AD or AP by comparing them, and AD / AP from item passives counts, so it comes after the conversions.
  - Rabadon's "stacks recursively" with every AP source, including Riftmaker's and the adaptive AP, so it comes last.
  - The order of items within a step never matters; a test checks this.
- **Known gap: Swiftmarch reads move speed once, when R is cast.** Move speed gained during the ult (Hexplate, Cosmic Drive...) would add about 1 AP per 20 move speed. Revisit when Hexplate is coded in 5d-5.
- **During-the-ult passives use one hook, `onHit`, called once per dagger (Step 5d-2):** renamed from `onDaggerHit`, because some items apply on-hit effects at other times too (Dusk and Dawn's repeat, later Guinsoo's Phantom hit). Those call `applyOnHitEffects()`, which runs every item's `onHit` once more.
- **Each item makes a fresh effect for every simulation (`createEffect`):** Spellblade remembers "already used", and a leftover memory from the previous build would give wrong numbers. A test checks this.
- **Resist shred from items is reported by each item (`shred(time)`), not written into Katarina's stats (Step 5d-3):**
  - Each time damage is calculated, the simulation adds every item's shred to Katarina's own pen (`addShred`). Flat amounts add; percentages multiply, like two % pens.
  - Chose this over letting items edit `attacker.armorShred` because two items could overwrite each other, and the simulation only copies the top layer of the attacker, so a change to the pen numbers one layer down would leak into the next build's simulation.
  - Debuffs on the dummy (Black Cleaver's armor reduction) count the same way. With one target, it doesn't matter whose side they're on.
  - `shred` gets the time of the damage, so "only counts after the hit" rules (Bloodletter's, Malignance, Terminus) compare times.
- **Two more hooks, `beforeDamage` and `afterDamage` (Step 5d-3):** run around every piece of damage, R's or an item's. Black Cleaver needs "before" (R's hit benefits from its own stack); the rest use "after". 0-damage pieces (R's AD part with no bonus AD) don't run them, since no damage was really dealt.
- **"More damage" items use one more hook, `damageMultiplier` (Step 5d-4):** each item returns what to multiply a piece of damage by. The simulation multiplies them all together, after armor / MR.
- **Amp items have no line of their own in the "by source" breakdown (Eric chose A, Step 5d-4):** they make the base / AP ratio / item lines bigger instead. Their value shows in the marginal damage line (with the item minus without it). Chose this over giving each amp its own line because, when 3 amps multiply together, there's no fair way to say which one caused which part of the extra damage.
- **The dummy has a `bonusHp` number (Step 5d-4):** the HP from its items, for Lord Dominik's. When the user types in HP (Step 7), bonus HP = typed HP − the champion's own HP at that level, and never below 0. Its max HP is just its starting HP (`targetMaxHp`), for Shadowflame.
- **Shadowflame checks HP per piece of damage:** R's base and AP ratio pieces of one dagger are one hit in the game, so if the base piece crosses 40%, the AP ratio piece gets the bonus a moment early. That's at most one dagger's AP part per ult, so we accept it.
- **"Same time" = "same frame" = "same hit":** a dagger's magic damage is stored as 2 pieces (base, AP ratio) for the breakdown, but it's one hit, so stack rules check the time to add only 1 stack per dagger.
- **The 5 Spellblade items share one helper (`src/items/spellblade.ts`)** for "first dagger only, × R's effectiveness"; each item file only says its own damage formula.
- **Rod of Ages' extra level raises Katarina's stats but not R's rank:** R rank comes from the stage, and 7 / 12 / 17 give the same rank as 6 / 11 / 16 anyway.
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
- **Stat-changing passives (Rabadon's...) run after the plain stats are added up,** in one marked spot in `katarina-stats.ts` (done in 5d-1).
- **Warmog's Vitality only counts items' plain HP stats,** not HP from item passives like Rod of Ages' stacks (wiki note on Warmog's page).
- **Adaptive force:** 1 point = 0.6 bonus AD or 1 AP, whichever of bonus AD and AP is higher. On a tie, the champion's "adaptive type" decides (Katarina's is magic → AP).
- **Move speed soft caps:** above 415 the extra counts 80%, above 490 it counts 50% (wiki example: 600 raw → 530).

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
- **Malignance test compared against the wrong "raw" damage (Step 5d-3, caught before commit).**
  - Bug: the test said dagger 2 did 26.3 damage but expected 28.7.
  - Cause: the test used a 0 MR dummy for "damage before MR". But Malignance's −10 MR took that dummy to −10 MR, and negative MR *raises* damage, so the "raw" numbers were 9% too high. The item was right; the test was wrong.
  - Fix: Malignance's tests use a 100 MR dummy only and compare daggers with each other.
- **Garbled "×" signs in `tests/simulation.test.ts` (found in Step 5d-4, already in the 5d-2 commit).**
  - Bug: two comments showed "Ã—" instead of "×".
  - Cause: in 5d-2, removing a BOM (a hidden marker PowerShell adds at the start of files) read the file with the wrong text encoding, so "×" turned into two other characters. Only comments were affected.
  - Fix: put the "×" signs back, and searched every file for the same garbling (none left). Lesson: write files with the editor or node, not PowerShell.

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
| Immortal Path | modelled | "Now and Forever": 4% more damage while above 50% HP. The dummy never hits back, so it's always on. `src/items/immortal-path.ts`. |
| Spellslinger's Shoes | checked, irrelevant | No passive. Its stats count. |
| Swiftmarch | modelled | "Noxian Fervor": adaptive force = 5% of total move speed (with soft caps), as AD or AP. `src/items/swiftmarch.ts`. |

### Legendary items
| Item | Status | Why |
|---|---|---|
| Abyssal Mask | modelled | "Unmake": the dummy takes 12% more magic damage (after MR) from every source. Katarina is next to it. `src/items/abyssal-mask.ts`. |
| Actualizer | checked, irrelevant | Active only. |
| Archangel's Staff | checked, irrelevant | AP from mana, but Katarina has no mana (wiki: resource "None"). Its AP stat counts. |
| Ardent Censer | checked, irrelevant | Needs healing allies. |
| Axiom Arc | checked, irrelevant | Needs takedowns. |
| Bandlepipes | checked, irrelevant | Needs slows / immobilizes, gives move speed. |
| Banshee's Veil | checked, irrelevant | Defensive. |
| Bastionbreaker | to model | "Shaped Charge": the first ability damage instance deals bonus true damage (40 + 1.5 per lethality for melee), 20 s cooldown. |
| Black Cleaver | modelled | "Carve": physical damage gives a stack (−6% armor each, up to −30%), one per dagger. R's own hit benefits from its own stack (wiki). `src/items/black-cleaver.ts`. |
| Blackfire Torch | to model | Burn on ability damage (only the part inside the channel counts) + 4% AP while the dummy burns. |
| Blade of The Ruined King | modelled | On-hit 9% (melee) of the dummy's current HP, physical (1 HP after the overkill point). `src/items/blade-of-the-ruined-king.ts`. |
| Bloodletter's Curse | modelled | "Vile Decay": R's magic damage gives a stack (−7.5% MR each, up to −30%), one per dagger, counting from the next hit. `src/items/bloodletters-curse.ts`. |
| Bloodthirster | checked, irrelevant | Shield. |
| Chempunk Chainsword | checked, irrelevant | Grievous Wounds; the dummy doesn't heal. |
| Cosmic Drive | checked, irrelevant | Move speed. |
| Cryptbloom | checked, irrelevant | Needs takedowns. Its pen stat counts. |
| Dawncore | checked, irrelevant | AP per 100% base mana regen, but manaless champions "do not use nor benefit from mana or mana regeneration" (wiki: Manaless). Its plain AP counts. |
| Dead Man's Plate | to model | Momentum is full at R cast (from walking). Check: do daggers consume it like a basic attack? |
| Death's Dance | checked, irrelevant | Defensive. |
| Dusk and Dawn | modelled | Spellblade, first dagger only: 75% base AD + 10% AP magic, then all on-hit effects once more 0.2 s later. `src/items/dusk-and-dawn.ts`. |
| Echoes of Helia | checked, irrelevant | Needs healing allies. |
| Eclipse | to model | Bonus damage after 2 stacks from different cast instances within 2 s. Check: R is one cast instance; do its burns or item effects count as separate ones? |
| Edge of Night | checked, irrelevant | Defensive. |
| Endless Hunger | checked, irrelevant | Needs takedowns. |
| Essence Reaver | modelled | Spellblade, first dagger only: 125% base AD + 0.5 per 1% crit chance, physical. `src/items/essence-reaver.ts`. |
| Experimental Hexplate | to model | "Overdrive": casting R gives 50% bonus attack speed (melee) for 8 s, which raises R's physical part. |
| Fiendhunter Bolts | checked, irrelevant | Empowers basic attacks after R. |
| Force of Nature | checked, irrelevant | Defensive. |
| Frozen Heart | checked, irrelevant | Defensive. |
| Guardian Angel | checked, irrelevant | Defensive. |
| Guinsoo's Rageblade | to model | "Wrath" (on-hit 30 magic) is modelled in `src/items/guinsoos-rageblade.ts`. Still to do in 5d-6: "Seething Strike" attack speed stacks and Phantom hits (daggers trigger them: Eric, from playing). |
| Heartsteel | to model | Stacks build up each second near the dummy (starting at 0), then an on-hit proc. Check: do daggers trigger the proc? Permanent HP stacks start at 0. |
| Hexoptics C44 | checked, irrelevant | Increases *basic attack* damage only. |
| Hextech Gunblade | checked, irrelevant | Active only. |
| Hextech Rocketbelt | checked, irrelevant | Active only. |
| Hollow Radiance | to model | "Immolate" aura: magic damage every second near Katarina, scales with bonus HP. |
| Horizon Focus | checked, irrelevant | Needs 600+ range; R's daggers only reach 550. |
| Hubris | checked, irrelevant | Needs takedowns (starts at 0 stacks). |
| Hullbreaker | to model | On-hit stacks, proc at max stacks. Check: do daggers count? |
| Iceborn Gauntlet | modelled | Spellblade, first dagger only: 150% base AD physical. `src/items/iceborn-gauntlet.ts`. |
| Immortal Shieldbow | checked, irrelevant | Defensive. |
| Imperial Mandate | checked, irrelevant | Needs an immobilize; R has none. |
| Infinity Edge | checked, irrelevant | No passive. Crit stats do nothing: abilities and on-hit can't crit. |
| Jak'Sho, The Protean | checked, irrelevant | Defensive. |
| Kaenic Rookern | checked, irrelevant | Defensive. |
| Knight's Vow | checked, irrelevant | Needs an ally. |
| Kraken Slayer | to model | On-attack stacks (starting at 0), proc at 2 stacks. Daggers trigger it (Eric, from playing). |
| Liandry's Torment | to model | "Suffering" (+2% damage per second in combat, up to 6%; starts at 0 when R is cast) is modelled in `src/items/liandrys-torment.ts`. Still to do in 5d-5: the "Torment" burn (only the part inside the channel counts). |
| Lich Bane | modelled | Spellblade, first dagger only (Eric, from playing): 75% base AD + 45% AP magic. `src/items/lich-bane.ts`. |
| Locket of the Iron Solari | checked, irrelevant | Active only. |
| Lord Dominik's Regards | modelled | "Giant Slayer": 1% more damage per 100 of the dummy's BONUS HP (from items), up to 15%. `src/items/lord-dominiks-regards.ts`. |
| Luden's Echo | to model | "Echo": ability damage fires bonus magic damage. Check: with only one enemy, how many of the 6 stacks hit it? |
| Malignance | modelled | "Hatefog": the first dagger makes a zone: (60 + 5% AP) / 4 magic damage every 0.25 s (10 ticks inside the channel) and −10 MR from dagger 2. "Scorn" (ultimate haste) is irrelevant. `src/items/malignance.ts`. |
| Manamune | checked, irrelevant | AD from mana, but Katarina has no mana. Its AD stat counts. |
| Maw of Malmortius | checked, irrelevant | Defensive. |
| Mejai's Soulstealer | checked, irrelevant | Stacks come from kills, so 0 stacks. Its plain AP stat counts. |
| Mercurial Scimitar | checked, irrelevant | Active only. |
| Mikael's Blessing | checked, irrelevant | Active only. |
| Moonstone Renewer | checked, irrelevant | Needs healing allies. |
| Morellonomicon | checked, irrelevant | Grievous Wounds; the dummy doesn't heal. |
| Mortal Reminder | checked, irrelevant | Grievous Wounds. Its armor pen stat counts. |
| Nashor's Tooth | modelled | On-hit 15 + 15% AP magic damage. `src/items/nashors-tooth.ts`. |
| Navori Flickerblade | checked, irrelevant | Lowers cooldowns of basic abilities. |
| Overlord's Bloodmail | modelled | "Tyranny": bonus AD = 2.5% bonus HP. "Retribution" is 0 at full HP. `src/items/overlords-bloodmail.ts`. |
| Phantom Dancer | checked, irrelevant | Ghosting. |
| Profane Hydra | checked, irrelevant | Cleave hits only *other* enemies; active doesn't count. |
| Protoplasm Harness | checked, irrelevant | Defensive. |
| Rabadon's Deathcap | modelled | "Magical Opus": +30% of ALL AP, including AP from other passives. `src/items/rabadons-deathcap.ts`. |
| Randuin's Omen | checked, irrelevant | Defensive. |
| Rapid Firecannon | to model | Energized (full at R cast): on-hit 40 magic damage. Daggers trigger Energized (Eric, from playing). |
| Ravenous Hydra | checked, irrelevant | Cleave hits only other enemies. |
| Redemption | checked, irrelevant | Active only. |
| Riftmaker | modelled | "Void Infusion": AP = 2% bonus HP. "Void Corruption": +2% damage per second in combat, up to 8%, starting at 0 when R is cast. `src/items/riftmaker.ts`. |
| Rod of Ages | modelled | "Timeless" is full (grows with time): +100 HP, +30 AP, and +1 level for her stats (max 18). The level doesn't change R's rank. `src/items/rod-of-ages.ts`. |
| Runaan's Hurricane | checked, irrelevant | Ranged champions only; Katarina can't buy it (in `katarinaCannotBuy`). |
| Rylai's Crystal Scepter | checked, irrelevant | Slow. |
| Serpent's Fang | checked, irrelevant | Reduces shields; the dummy has none. |
| Serylda's Grudge | checked, irrelevant | Slow. Its pen stat counts. |
| Shadowflame | modelled | "Cinderbloom": magic and true damage × 1.2 when the dummy is already below 40% of its max HP. `src/items/shadowflame.ts`. |
| Shurelya's Battlesong | checked, irrelevant | Active only. |
| Spear of Shojin | modelled | "Focused Will": R's damage gives a stack (max 1 per second per cast), +3% R damage each, counting from the next hit. During R: +3% on daggers 2-8, +6% on 9-15. `src/items/spear-of-shojin.ts`. Check: see "Unconfirmed". |
| Spirit Visage | checked, irrelevant | Defensive. |
| Staff of Flowing Water | checked, irrelevant | Needs healing allies. |
| Statikk Shiv | to model | Energized (full at R cast): chain lightning 60 magic damage on-hit. Daggers trigger Energized (Eric, from playing). |
| Sterak's Gage | modelled | "The Claws that Catch": bonus AD = 50% of base AD, which counts for R. `src/items/steraks-gage.ts`. |
| Stormrazor | to model | Energized (full at R cast): 100 magic damage on-hit. |
| Stormsurge | to model | Deal 25% of the dummy's max HP within 2.5 s → lightning strike 2 s later (may land inside the channel). |
| Stridebreaker | checked, irrelevant | Cleave hits only other enemies; active doesn't count. |
| Sundered Sky | checked, irrelevant | Empowers the next *basic attack*. |
| Sunfire Aegis | to model | "Immolate" aura: magic damage every second near Katarina. |
| Terminus | modelled | "Shadow": on-hit 30 + 10% bonus AD + 10% AP magic. "Juxtaposition": Dark hits (2nd, 4th, 6th on-hit) give +10% armor and magic pen each, up to 30%. `src/items/terminus.ts`. Check: see "Unconfirmed". |
| The Collector | checked, irrelevant | Execute below 5% HP; under our overkill rule the dummy never dies. Its lethality stat counts. |
| Thornmail | checked, irrelevant | Reflects damage Katarina takes. Its HP stat counts (Riftmaker). |
| Titanic Hydra | modelled | "Cleave": on-hit 1% (melee) of Katarina's max HP, physical. `src/items/titanic-hydra.ts`. |
| Trinity Force | modelled | Spellblade, first dagger only: 200% base AD physical. `src/items/trinity-force.ts`. |
| Umbral Glaive | checked, irrelevant | Needs Katarina unseen; Death Lotus reveals her. |
| Unending Despair | to model | Sap: magic damage every 4 s in combat. Check: does the first sap happen right away? |
| Void Staff | checked, irrelevant | No passive. Its 40% magic pen stat counts. |
| Voltaic Cyclosword | to model | Energized (full at R cast) + "Galvanize": ability damage triggers the Energized hit. |
| Warmog's Armor | modelled | "Warmog's Vitality": +12% of items' plain HP stats (not HP from item passives). Matters with Riftmaker / Overlord's. `src/items/warmogs-armor.ts`. |
| Winter's Approach | checked, irrelevant | HP from mana, but Katarina has no mana. |
| Wit's End | modelled | On-hit 45 magic damage. `src/items/wits-end.ts`. |
| Youmuu's Ghostblade | checked, irrelevant | Move speed; active doesn't count. |
| Yun Tal Wildarrows | to model | "Flurry": 30% attack speed when launching a basic attack. Check: do daggers trigger it? (Its crit stacks don't matter.) |
| Zeke's Convergence | to model | Casting R summons a storm that damages the dummy (Katarina is next to it). |
| Zhonya's Hourglass | checked, irrelevant | Active only. |
