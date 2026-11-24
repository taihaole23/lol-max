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
    - 5d-5 burns, auras and timed effects is split in two:
      - 5d-5a is done: Liandry's burn, Sunfire, Hollow Radiance, Zeke's, Luden's, Bastionbreaker. Unending Despair and Eclipse turned out irrelevant. 13 items left "to model".
      - 5d-5b is done: Blackfire Torch (burn + 4% AP that adds to Rabadon's), Experimental Hexplate (closes the Swiftmarch move speed gap), Stormsurge. 10 items left "to model".
      - 5d-5c (fixes from the Death Lotus wiki page) is done: the Death Lotus bug now shrinks Liandry's, Blackfire's and Luden's damage, and Eclipse is modelled (it was "irrelevant").
    - 5d-6 stack-then-proc is done: Guinsoo's Seething Strike (attack speed + Phantom Hits), Kraken, Hullbreaker, Yun Tal, the Energized items (Rapid Firecannon, Statikk, Stormrazor, Voltaic), Dead Man's Plate. Heartsteel turned out irrelevant. **0 items left "to model": Step 5 is done.**
- Step 6 (optimizer) is split in two:
  - 6a (the search) is done: `src/optimizer/` has the item pool and filter, the top-5 keeper, the every-build and beam searches, and `explainBuild` (breakdown + marginal damage + interactions).
    - One-time check (Nov 23, 2026, patch 26.23): `npm run test:slow` passed. For all 3 enemy types, Late's beam top 5 matched trying all ~1.3 million builds, and Full's beam of 300 matched a beam of 1,000 and, in a second run, a beam of 5,000 (~40 s each). The slow test now uses 5,000.
  - 6b (Web Worker) is done: `worker.ts` runs `runSearch` (search + explain the top 5) in its own thread. The page will call `startSearch`, which returns a Promise and reports progress. `npm run build` bundles the worker as its own file. It gets its first real browser test in Step 7.
- Step 7 (user interface) is split into 5 parts (Eric reshaped the page in planning, see "Decisions"):
  - 7a (engine: stage becomes a preset) is done: the search takes `level`, `rRank` and `itemCount` (`src/optimizer/setup.ts`) instead of a stage name. `stagePreset()` fills them in from a stage. Impossible setups (rank 3 at level 6, 7 slots) throw.
  - 7b (page layout) is done: `index.html` (fixed layout), `src/main.ts` (draws the page from the state, reacts to clicks), `src/ui/state.ts` (the page's state + the functions that change it, unit tested), `src/style.css`. Checked in headless Chrome: no console errors.
  - 7c (searches on the page) is done: `src/ui/searches.ts` runs the quick search on every change and Optimize on click, `src/ui/progress.ts` makes the progress bar's text. Checked in headless Chrome: the quick search shows up ~0.1-0.3 s after a change, Optimize on Full took ~2.6 s, the thebausffs text appeared, and changing the enemy mid-Optimize cancelled it. No console errors.
  - 7d (breakdowns) is done: `src/ui/breakdown-rows.ts` turns a build's explanation into rows (tested: each breakdown adds up to the total), `src/ui/results-view.ts` draws them, and the top 5 are clickable cards. Checked in headless Chrome in light and dark mode, no console errors.
  - 7e (rules, sources, styling) is done: `src/ui/info-view.ts` (the "How it's calculated" rules and the filtered items), `src/data/sources.ts` (every source link, gathered from the data files). Every item passive now has a required `source` field. Checked in headless Chrome at desktop width and at 375 px (a phone): nothing sticks out sideways, no console errors. **Step 7 is done.**
- Step 8 (Practice Tool validation) is in progress:
  - Done: the plan `validation/practice-tool-plan.md` (16 tests), the cases in `tests/practice-tool-cases.ts`, the test `tests/practice-tool.test.ts` (skips cases with no measurement yet), and the dummy's facts in `src/data/practice-tool.ts`.
  - Round 1 measured (Nov 23, 2026, patch 26.23, one ult each): **12 of 16 match** within 1%, most of them exactly (base damage at all 3 ranks, MR, Void Staff, AP ratio, Rabadon's, Nashor's at 25 / 30 / 35%, Luden's). Riftmaker + Warmog's is 0.5% low (passes).
  - **Off:** 7 Bloodthirster +22, 12 Liandry's +10, 15 BotRK +34, 16 Guinsoo's +13. `npm test` fails on these 4 until they're explained; that's on purpose.
    - Liandry's: +9.6 ≈ one more burn tick (each is ~9.2), so the burn probably ticks once right away. Matches Eric's feeling in game.
    - 7, 15, 16 are the only tests with bonus AD. No single change (attack speed growth, the physical ratio, the ratio per attack speed, flat extra AD) fits all three, so they likely have separate causes. Round 2 (7a, 7b, 7c) narrows down test 7.
  - **Fixed after round 1 (Eric's call): burns and auras tick right away.** `ticking.ts` now ticks once when the effect turns on, then every interval. Liandry's (test 12) went from +9.6 to +0.6. Applies to Liandry's, Blackfire, Sunfire and Hollow Radiance.
  - Round 2 measured (same day, one ult each): 7a +17, 7b +29, 7c +17, 17 +85 (+2.1%), 18 +65, 19 +21, 20 −6, 21 exact. Stats panel at level 16 with Bloodthirster: 184 AD, 0.919 attack speed, exactly the calculator's.
  - **Finding 1: the dummy's damage COUNTER over-reports by one R physical hit. The calculator was right.**
    - All four plain-AD tests (levels 6, 11, 16; Bloodthirster and Death's Dance) read ×1.067 (= 16/15) on R's physical part. First guess: the game deals more physical than the wiki says. That was WRONG.
    - Eric recorded test 7b and played it back: 15 physical numbers of 28 (wiki: 28.66) and 15 magic of 50, exactly the wiki. The counter still said 1209 (calculator 1180).
    - The dummy's HP bar after the ult: **1821 of 3000 → 1179 lost**, which is the calculator's 1180. So the counter adds ~29 (one physical hit) that never happened.
    - Lesson: **read the dummy's HP bar, not its counter,** for anything with physical damage. Magic-only tests are exact on the counter.
    - Modelling the counter as "real damage + R's first physical hit" fits every AD test within 0.1%.
    - So `tests/practice-tool.test.ts` compares counter readings with "real + one R physical hit" (`counterExtraRPhysicalHits` in `src/data/practice-tool.ts`), and HP-bar readings (`hpAfter`) with the real damage.
  - **Finding 2 (confirmed, now the model): on-hit effects land BEFORE R's own damage in a dagger** (our first guess was the opposite). Order in `simulate.ts`: on-hit → R's damage → on-attack.
    - With the counter correction, "R first" left BotRK tests 15 and 17 at +1.1% (fail); "on-hit first" gave 0.0% / +0.1%.
    - Checked on the HP bar (no counter involved): test 17 left the dummy at **2003** HP. On-hit first predicts 1998, R first 2037.
  - **Result: all 24 counter readings within 0.52%, 21 of them within 0.1%; both HP-bar readings within 0.12%.**
  - **Test 22, a blind prediction:** BotRK + Guinsoo's + Statikk + Yun Tal + Kraken + Shadowflame, level 16, 10,000 HP dummy, 10 resist. Predicted **966** HP left before Eric cast; he measured **970** and **980** (−0.05% / −0.16%). First in-game check of Statikk, Yun Tal, Kraken and Shadowflame. The two tries differ by 10, about the game's own run-to-run variation.
  - **Test 23, AD build vs 150 armor:** Gunmetal Greaves, BotRK, Guinsoo's, Lord Dominik's, Yun Tal, Voltaic. Level 18, 8,000 HP dummy, 150 resist.
    - Eric first compared the counter (5,814) with the site (5,610) and saw ~200 off. 153 of that is the counter's phantom R hit, which is big here because bonus AD and attack speed are high.
    - On the HP bar: predicted **2,390** HP left before the cast; measured **2,424** (the calculator is +0.6% high).
    - It was the first test with high armor, so it covers Lord Dominik's % pen and Voltaic's lethality.
  - Leftovers (all inside the 1% tolerance, causes unknown): Riftmaker tests 13 and 20 −0.5% (magic only, so not the counter), 18 (Guinsoo's + BotRK + Terminus, 50 resist) −0.5%, and 23 +0.6%.
    - 23 is the only one where we predict too MUCH damage. If a later high-armor test also comes out high, check how Lord Dominik's and Voltaic's lethality combine against armor first.

- **Redesign before deploying (Eric, after Step 8):** the page is rebuilt in 4 parts before Step 9.
  - Part 1 (icons) is done: `scripts/update-icons.mjs` (`npm run update-icons 16.23.1`) saves every champion's icon and 4 ability icons, every item icon (`public/icons/`), and the champion list (`src/data/champion-list.26.23.json`). 9.4 MB in total. `tests/icons.test.ts` checks every icon exists.
  - Part 2 (pages) is done:
    - `src/ui/router.ts` reads the address (`/`, `/about`, `/<champion>`, `/<champion>/<q|w|e|r>`) and changes page without reloading (History API).
    - Pages are in `src/ui/pages/`: `champion-page.ts` (the optimizer, moved out of `main.ts`) and `simple-pages.ts` (home, How it works, not found).
    - `src/ui/champion-search.ts` is the search bar (big on home, small in the top bar).
    - `src/ui/theme.ts` handles the dark default and the light toggle; `vercel.json` makes every address load the site.
    - Checked on the built site in headless Chrome: every page, typing in the search, Enter, the back button, a remembered light mode on a direct `/katarina/r` load, Ahri's "coming soon" page, a bad address. No console errors.
  - Part 3 (champion page layout) is done: ability icons with names on hover, a fixed 6-slot item row (boots on the left) with − / + that never move, item icons, enemy types with the dummy champion's icon, the dummy's items as icons. Checked in headless Chrome: the − / + buttons sat at exactly the same screen position after every slot change and boots toggle; fits a 375 px phone. No console errors.
  - **Locks, bans, item cards and a polish pass (Eric, after part 4):**
    - Click any item slot → the item picker (`src/ui/item-picker.ts`): search and lock an item into that slot, or lock / ban the optimizer's pick. A small × on a result item bans it straight away. Banned items show as chips under the slots (click to allow again).
    - Locking or banning shows the quick answer and brings back the Optimize button. It used to re-run Optimize by itself; Eric changed that so several changes can be made in a row.
    - The engine (`src/optimizer/constraints.ts`, `search.ts`): locked items start every build, banned items leave the pool, locked boots are the only boots tried. `constraintProblem()` explains impossible conditions in words ("Void Staff and Terminus can't be built together"), and the picker greys out items that would cause one.
    - Rich item tooltips (`src/ui/tooltip.ts`, `item-card.ts`): cost, stats, passives / actives, and whether the passive is modelled. The passive text comes from Data Dragon (`effects` in the item snapshot, display only).
    - New design system in `style.css`: bigger type (17 px), spacing / radius / colour tokens, switches, segmented stage control, a full-width ability bar with 84 px icons, centred champion header.
    - `npm run test:slow` re-run after the search change (Nov 23, 2026): all 6 passed (~4 min). The beam still matches trying every build on Late, and beam 300 = beam 5,000 on Full, for all 3 enemy types.
    - Checked in headless Chrome (built site): lock → auto re-optimize with the item in all 5 builds; ban → gone from every build; Terminus greyed out next to a locked Void Staff; clear; light mode; every page fits a 375 px phone. No console errors.
  - Part 4 (results) is done: each top-5 build is one row (rank, damage, item icons with boots first, names on hover), and item lines in "By source" and "What each item adds" show their icon. Checked in headless Chrome, dark, light and phone. **The redesign is done; next is Step 9 (deploy), which Eric does himself.**

## Confirmed in the Practice Tool (Step 8, patch 26.23)
- **Within one dagger: on-hit effects → R's own damage → on-attack effects** (HP bar, test 17). Was assumed the other way round.
- **Burns tick right away, then every interval** (Liandry's, tests 12 and 20). Applied to every ticking effect (Liandry's, Blackfire, Sunfire, Hollow Radiance) at Eric's call; only Liandry's was measured.
- **Daggers give Guinsoo's stacks, and Phantom Hits come after daggers 7, 10, 13 at R's reduced %** (tests 16, 19 within 0.1%).
- **The Death Lotus bug shrinks Liandry's and Luden's damage** by R's %, and **Luden's fires once** (tests 12, 14, 21 within 0.1%).
- **On-hit at 25 / 30 / 35% by rank** (Nashor's, tests 9-11, exact).
- **The dummy's damage counter adds one R physical hit that never happened;** its HP bar is right (test 7b).
- **An AD build against 150 armor** (Lord Dominik's, Voltaic, BotRK, Guinsoo's, Yun Tal, Gunmetal Greaves; test 23, HP bar within 0.6%).
- **Statikk Shiv, Yun Tal, Kraken Slayer and Shadowflame together** (test 22, within 0.2%). Not checked one by one, so a small error in one could hide behind another, but none is big.

## Unconfirmed: to check in the Practice Tool (Step 8)
- **When the first dagger lands.** The wiki only says "every 0.166 seconds". We assume 0 s (`firstDaggerSeconds` in `katarina.ts`). It only matters for timed effects near the end of the channel.
- **Whether R's 25 / 30 / 35% effectiveness also shrinks Terminus's Juxtaposition stacks** (10% pen per Dark stack), or only on-hit *damage* (our assumption). Neither the wiki nor Eric knows.
  - That daggers *do* give Juxtaposition stacks is confirmed by Eric from playing. The wiki only says "basic attacks on-hit".
  - **Whether the first Juxtaposition hit is Light or Dark.** We assume Light (Dark = 2nd, 4th, 6th hit), the safer guess.
- **Malignance's tick timing.** We assume the first tick lands 0.25 s after the zone appears (12 ticks over 3 s = the wiki's "180 total"), so 10 ticks fall inside the channel. If the zone ticks right away, it's 11.
- **Bloodletter's Curse stacks only from R's own magic damage,** not from items' on-hit magic damage (our assumption: on-hit damage is item damage, not ability damage).
- **Black Cleaver: R's hit benefits from its own stack.** The wiki says so (listed as a bug) for non-basic damage. If it's been fixed, dagger N has N − 1 stacks instead of N.
- **"Deal X% more damage" effects** (damage amplification): we apply them after armor/MR and multiply them together. Sources: the wiki's Damage page ("percent damage modifiers stack multiplicatively"), Liandry's page (its bonus "stacks multiplicatively with other damage multipliers") and Shadowflame's worked examples. Still worth one Practice Tool check (e.g. Abyssal Mask + Immortal Path).
- **"Per second in combat" stacks (Liandry's, Riftmaker) come at exactly 1 s and 2 s after R is cast** (our assumption).
- **Sunfire, Hollow Radiance and Blackfire tick right away like Liandry's** (applied, but only Liandry's was measured). Zeke's has its own timing (first tick 0.25 s in), unchanged and unmeasured.
- **Blackfire Torch's +4% AP starts right after dagger 1,** so dagger 1 itself doesn't get it (dagger 1 is what starts the burn).
- **Stormsurge's 25% counts damage after armor / MR, from every source** (R and items). The strike uses Katarina's AP when it lands, not when it was triggered. In practice it only matters against a low-HP dummy, since 25% must be reached by 0.5 s.
- **Eclipse procs on dagger 2** (8% of the dummy's max HP). The Death Lotus page says each dagger counts as a separate hit for Eclipse, though Eclipse's own text says "one stack per cast instance". Eric hasn't seen it proc either way.
- **The Death Lotus bug on Blackfire** (confirmed for Liandry's and Luden's, not measured for Blackfire). The wiki also lists Hextech Alternator and runes (version 2).
- **Guinsoo's Phantom Hits give Kraken and Hullbreaker stacks, but not Energize stacks** (their timing and size are confirmed).
- **Kraken Slayer's missing-health bonus grows in a straight line** (the wiki's "0 to 75 by 5" might mean 5% steps).
- **Hullbreaker procs on every 5th hit** (daggers 5, 10, 15). The wiki's "at maximum stacks, or 4 stacks" is unclear; it could be every 6th hit.
- **Energized items proc once, on dagger 1:** each dagger gives 6 Energize, not Statikk's 15. Statikk's lightning is not shrunk by R's % (wiki), the others are.
- **Voltaic Cyclosword fires before R's first damage, unshrunk.** We don't make it fire the OTHER Energized items early (simplification, see `voltaic-cyclosword.ts`).
- **Daggers use up Dead Man's Plate's Momentum and trigger Yun Tal's Flurry,** like basic attacks.
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
| `npm run test:slow` | The slow optimizer checks (~3 minutes): the beam search against trying every Late build, for each enemy type. Run it before each release and after changing item passives or the search. `npm test` skips these. |
| `npm run update-items -- 16.23.1` | Downloads Riot's item data and saves the snapshot `src/data/items.<patch>.json`. The number is Data Dragon's version for our patch. Only needed when the patch changes. |
| `npm run update-icons -- 16.23.1` | Downloads every champion, ability and item icon and the splash art, and picks each champion page's colour from its splash. Run it after `update-items`. |
| `npm run patch-day` | Patch day, the automatic part: switches to the newest patch, downloads everything, lists what changed (items and wiki) and runs the tests. Writes `patch-report.md`. In Claude Code, `/patch-day` runs this and then works through the report. |
| `npm run check-wiki` | Shows what changed on the wiki since the saved copies in `wiki-watch/`. `npm run check-wiki -- --accept` saves the wiki as it is now (only after every change is handled). |
| `npm run patch-diff` | Compares the two newest item snapshots. |
| `node scripts/splash-colors.mjs` | Only re-picks the splash colours from the saved splashes (no download). For trying out changes to how colours are picked. |
| `npm run build` | Type-checks the code (`tsc`), then builds the real website into `dist/`. This is what Vercel runs. |

## Project layout (planned)
```
src/
  data/        game numbers, each with a source link and patch
  items/       one file per hand-coded item passive
  ...          formulas, simulation, optimizer, user interface
  optimizer/   item pool + filter, legal builds, Katarina's setup (level / R rank / item count) and stage presets,
               the searches, the top 5 and each build's explanation
scripts/       update-items.mjs: downloads item data from Data Dragon
tests/         unit tests and the Practice Tool validation test
validation/    Practice Tool test plan and measurements
```

## Decisions (chose X over Y because...)
- **Top 5 builds instead of top 10:** easier to read, and shows enough options.
- **Beam search for Late and Full, every build for Early and Mid (Eric, Step 6):**
  - Measured: one simulation takes ~0.024 ms, and the item filter only removes Frozen Heart. Almost every item gives HP, and Riftmaker turns HP into AP, so nearly everything must stay. PLAN.md had guessed the filter would cut Full to ~75 million builds.
  - Trying every build: Late ~1.3 million (~30 s) and Full ~680 million (~4.5 hours). Too slow for a website.
  - A **beam search** builds one item at a time and keeps only the best 300 partial builds at each size: ~2 s for Late, ~3 s for Full. It isn't guaranteed to find the true best, so two slow tests check it (see "How to run").
  - Chose 300 because beams of 1,000 and 5,000 gave the same answers, at about 4× and 12× the time.
- **Stages are presets, and every input is editable (Eric, Step 7):** a stage button fills in Katarina's level, R rank and item count, and the dummy's level and items. The user can change each one. The site is meant to be a sandbox; the presets just save time.
  - R rank must be legal for the level (rank 2 needs level 11). Chose "accurate" over "allow anything" because the site's value is that the numbers are real. Basic ability rank rules are ignored for now.
  - Item slots have +/− buttons: 1 to 6 legendaries with boots off, 1 to 5 with boots on (6 slots in total, `inventory.slots` in `game-rules.ts`).
  - The search picks its method from the item count, not the stage: up to 2 items tries every build, 3 or more uses the beam. Same split as before for the presets.
  - Typed-in dummy stats may go below the preset (a squishier mid-game Nami is fine). Typed armor / MR below the champion's base: base becomes the typed number and bonus becomes 0. Otherwise bonus = typed − base (same rule as HP).
  - The dummy has its own level box, which starts at the stage's level.
  - The dummy's custom items: legendaries plus one optional boots, like the recommended lists.
- **The page as a shell for later champions (Eric, Step 7):** a champion picker (only Katarina) and her 4 ability cards are always on screen, so switching to another ability later is one click. Only R works in version 1; Q, W and E show "coming soon". The math is still Katarina R only.
- **A quick search on every change, Optimize for the rest (Eric, Step 7):** the best 1 item + boots takes ~15 ms, so it reruns whenever an input changes. Filling every slot takes up to ~3 s, so it waits for the Optimize button. A button instead of auto-running everything, because typing "120" into a box would start 3 searches.
- **The page is "state + render" (Step 7b):** one object holds everything the user picked (`src/ui/state.ts`). Every click calls a function that returns a new state, then `render()` redraws the page from it. Chose this over changing bits of the page directly in each click handler, because then the page can never disagree with the state, and the state functions can be unit tested without a browser.
  - Number boxes react to the "change" event (Enter or leaving the box), not every key, so typing "12" never sets level 1 first.
  - Anything that changes the calculated dummy (enemy type, dummy level, dummy items, a stage) clears typed-in HP / armor / MR, so an old typed number never sits silently on a new dummy. Typed boxes are highlighted, with a "Reset to calculated" link.
  - The stage button stays highlighted after you edit the level: it shows the last preset used, which also decides the dummy's recommended items.
- **Each search result remembers its "key" (Step 7c):** the exact request it answered, as JSON text. The page only shows a result whose key matches the current inputs. Chose this over clearing results on every change because:
  - "+" then "−" brings the Optimize result straight back, with no new search;
  - "+" or "−" doesn't rerun the quick search (the 1-item question didn't change);
  - with 1 slot, the quick question and the full question have the same key, so the quick result IS the answer and Optimize is hidden.
  - A search whose key no longer matches is cancelled (`cancelSearch` in `start-search.ts`), so changing the dummy mid-Optimize stops the old one.
- **Search updates redraw only the results part (Step 7c):** progress arrives ~100 times during Optimize; redrawing the whole page each time would reset a number box you were halfway through typing.
- **How the breakdowns are drawn (Step 7d):**
  - "By source" and "What each item adds" are tables with one bar per row, all one colour, instead of one big stacked bar. A full build can have 10+ sources, and a stacked bar can't give that many parts colours people can tell apart.
  - Damage type (3 parts) and ability vs. items (2 parts) are thin stacked bars. Their colours come from a colour-blind-checked palette and were run through a checker script against our panel colours in light and dark mode. Every colour also has a written label and number, so colour is never the only clue.
  - Items with no damage effect of their own (Yun Tal, boots) don't appear in "By source"; their value shows in "What each item adds".
  - Numbers are rounded to whole damage, so a column can be 1-2 off its total.
- **The rules text and the sources list are built from the data (Step 7e):** the rules read their numbers (15 daggers, 25 / 30 / 35%, 1 HP, beam width 300) from the data files, and the sources list reads every `source` field. So a patch update can't leave the explanation saying something different from what the math does. A test checks every source is a wiki or Data Dragon link for the current patch, and every item passive is listed.
- **Footer says it's a fan project, not made or endorsed by Riot (Step 7e):** Riot asks fan projects to say this (their "Legal Jibber Jabber" policy).
- **Practice Tool tests use the dummy's own damage counter (Step 8):** the wiki says the dummy tracks "total damage", so no adding up numbers by hand. The counter can't go past the dummy's max HP − 1, so every test raises the dummy's HP well above the expected damage (a test checks expected < 80% of its HP).
  - The dummy starts at 0 armor / MR, so armor / MR added with the cheat counts as bonus; HP above its 1000 counts as bonus HP.
  - Neutral rune page (checked on each rune's wiki page): Guardian, Demolish, Second Wind, Unflinching + Cash Back, Cosmic Insight; shards ability haste, move speed, tenacity. Not the health shards: Riftmaker turns HP into AP. Move speed only matters for Swiftmarch, which isn't tested.
  - Plain test items: Zhonya's (only AP) and Bloodthirster (only AD). No item gives only AD or only AP without HP, but HP changes nothing without an HP-scaling item.
- **The redesign (Eric, after Step 8):**
  - Dark theme by default, with a light toggle. A dark stats-site look of our own (not a copy of any other site).
  - Home page = title + a long search bar. The search lists EVERY champion (Eric) and narrows as you type; champions the site can't calculate yet are marked "coming soon". Then the champion page has a smaller search bar at the top to switch.
  - Ability icons with the name on hover. Enemy types show the dummy champion's own icon (Eric: Nami / Illaoi / Sion), since that's what the dummy is.
  - Item slots: a FIXED row of 6, boots always on the far left, +/− never move. Switched-off slots stay in place, greyed out.
  - Top 5: damage + item icons, names on hover. Rules / filtered items / sources move to their own "How it works" page.
  - Real web addresses (`/katarina/r`, `/about`), not `#` ones (Eric). Needs a Vercel setting so those addresses load the site.
  - Built so a new champion is data only: one champion list, one ability page for any champion and ability, icons from a script.
- **How the pages are built (redesign part 2):**
  - Each page draws itself into a FRESH container, and its click listeners hang on that container. Changing page throws the container away, listeners included, so they can't pile up or fire on the wrong page.
  - The champion page returns a "clean-up" function the router calls on leaving: it stops search results from drawing onto a page that's gone. The page's settings (`state`) live outside the page, so leaving and coming back keeps them.
  - The ability is part of the address (`/katarina/q`), so a link or a refresh opens the same ability.
  - Search order: playable champions first, then names starting with what's typed, then A to Z. Matching ignores case and punctuation ("kaisa" finds Kai'Sa).
  - `vercel.json` sends every address to `index.html` (a "rewrite"). Real files like `/icons/...` are still served as they are; Vercel only uses the rewrite when no file matches. Without it, opening `lol.ericzhong.ca/katarina/r` directly would give a 404.
- **Locks and bans (Eric):**
  - A lock is tied to a SLOT (lock Zhonya's into slot 2 and it shows in slot 2); the search just treats it as "must include". The other items fill the free slots in order.
  - The search method is chosen by FREE slots, not all slots: lock 3 of 5 and even Full is an exact every-build search.
  - A locked item may be one the speed filter removed (Frozen Heart): it's added back to the pool for that search only.
  - The quick search is "locked items + 1 free item + boots", so it stays fast and is the whole answer when all but one slot is locked.
  - Nothing re-runs Optimize by itself (Eric, later). At first, changing a lock or ban while a full answer was shown re-ran Optimize automatically. But a few seconds of loading after every click got in the way of making two changes in a row (a lock, then mid quest). Now every change shows the quick answer, and Optimize waits for a click.
  - The dummy's items use the same 6-slot row and item picker as the build. With "Recommended" on, the slots show the recommended items. Picking a different one switches to custom items, starting from the recommended list. This replaced a column of drop-down menus.
- **The item tooltip is JavaScript, not CSS (replaced the `::after` tooltip):** a CSS tooltip can only show one line of text; the item card needs an icon, stats and passives. One floating box is reused for the whole site and kept inside the window. Plain `data-tip` text still works through the same box.
- **Hover names are our own tooltip, not the browser's `title`:** the browser's own tooltip shows up late (about a second) and can't be styled. First a CSS rule (redesign part 3), now `src/ui/tooltip.ts` (see above). Icons also get `alt` text, so screen readers still say the name.
- **The item row is a grid of exactly 6 columns that never wraps (redesign part 3):** switched-off slots stay as greyed boxes, so the row's width never changes and the − / + buttons beside it never move. On phones the slots shrink (36 px) instead of wrapping onto a second line.
- **Icons are saved copies from Data Dragon, not loaded from Riot while the site runs:** same rule as item data, so the site can't break or change if Riot's server does. Riot allows fan projects to use them if the site says it's a fan project (it does). All 173 champions' ability icons are saved too (4 MB), so adding a champion needs no icon work.
- **Ties rank the cheaper build first, then by name:** so the top 5 never depends on the order the search happened to try builds.
- **Builds are always listed in the same item order** (legendaries in pool order, then boots): BotRK reads current HP, so item order can change the damage by a hair. With one order, both searches give the exact same number for the same build.
- **"Item interactions" can be negative:** each item's marginal damage is "with the build minus without that item". When items boost each other (Rabadon's × another AP item), the boost shows up in BOTH items' marginals, so interactions take one copy back out, and the line adds up to the total.
- **The worker's job is a plain function, `runSearch` (Step 6b):** `worker.ts` only passes messages. Vitest runs in Node, which has no Web Workers, so this way everything except the ~5 lines of message passing is tested.
- **Progress is sent only when it grows by 1% or more (Step 6b):** the beam reports after every partial build (thousands of times), and each message has to be copied between threads. ~100 messages are plenty for a loading bar.
- **A new search cancels the old one (Step 6b):** `startSearch` stops the old worker and rejects its Promise with `SearchCancelled`. Chose this over letting both finish, because a slow old search could finish after the new one and show results for settings the user already changed.
- **Slow tests use `npm_lifecycle_event`:** npm sets it to the running script's name, so `search.slow.test.ts` runs only under `npm run test:slow`. Chose this over a separate config file or an environment variable, because setting a variable differs between Windows and Mac/Linux.
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
- **Stat passives run in four fixed steps (Step 5d-1):** add → convert (HP → AP / AD) → adaptive force → percent (Rabadon's). Why this order, from the wiki:
  - Riftmaker and Overlord's use ALL bonus HP, so HP-adding passives (Warmog's, Rod of Ages) must come first.
  - Adaptive force picks AD or AP by comparing them, and AD / AP from item passives counts, so it comes after the conversions.
  - Rabadon's "stacks recursively" with every AP source, including Riftmaker's and the adaptive AP, so it comes last.
  - The order of items within a step never matters; a test checks this.
  - Step 5d-5b renamed "addHealth" → "add" (Hexplate adds attack and move speed there) and "multiply" → "percent" (see `apPercentBonus` below).
- **% AP bonuses are added up in `apPercentBonus` and applied once, at the end (Step 5d-5b):** the wiki says Blackfire's +4% ADDS to Rabadon's 30% (× 1.34, not × 1.3 × 1.04). So Rabadon's no longer multiplies AP itself; it adds 0.3, and `katarinaStats` multiplies AP by (1 + apPercentBonus) last. Blackfire adds its 4% mid-ult with `addApPercent` (`src/stats/ap-percent.ts`), which takes the old % back out first. It's in its own file because putting it in `katarina-stats.ts` would make a circular import (katarina-stats → items → Blackfire → katarina-stats).
- **Swiftmarch reads move speed from Katarina's stats (`flatMoveSpeed`, `percentMoveSpeed`), not from the item list (Step 5d-5b):** so passives can add move speed first. Experimental Hexplate's Overdrive starts on R cast (time 0, before any dagger) and lasts longer than the ult, so it's a plain stat passive in the "add" step, and Swiftmarch counts its +20%. This closed the old "known gap". Move speed gained *later* in the ult still wouldn't count, but no modelled item gives any.
- **`afterDamage` also gets the damage amount (Step 5d-5b),** after armor / MR and every multiplier. Stormsurge adds it up. Stormsurge needs no "within 2.5 s" window code: the whole ult is 2.5 s, so all of its damage is inside the window.
- **We model the Death Lotus bug (Eric, Step 5d-5c):** the wiki lists a bug where R's on-hit effectiveness also shrinks Liandry's, Blackfire's and Luden's damage. Chose to copy the game, bug included, over the "intended" numbers, because the site should match what players see, and the Practice Tool test will measure the real game.
- **Heartsteel's stacks start at 0 when R is cast (Eric, Step 5d-6):** they build 1 per second near an enemy, which fits the "stacks earned by fighting start at 0" rule. So the 3rd stack comes at 3 s, after the ult, and Heartsteel is irrelevant.
- **One more hook, `onAttack` (Step 5d-6):** runs once per dagger, between R's damage and on-hit effects. Repeat on-hits (Phantom Hit, Dusk and Dawn) only run `onHit`, as the wiki says Phantom Hits "do not interact with on-attack effects". Guinsoo's stacks, Yun Tal's Flurry and Energize stacks use it.
- **Katarina's stats include her `level` (Step 5d-6):** Kraken Slayer's damage grows with level. It's the level after Rod of Ages' extra level.
- **The Energized items share one helper (`src/items/energized.ts`):** each item keeps its own bar, starting full. They all fill and empty the same way, so 2 Energized items both proc on dagger 1, as in the game.
- **"Right after this hit" = `schedule(0, ...)` (Step 5d-5b):** a 0-second delay runs after everything else already happening at that moment (the rest of the dagger, its on-hit effects). Blackfire uses it so dagger 1 doesn't get the AP it triggers.
- **During-the-ult passives use one hook, `onHit`, called once per dagger (Step 5d-2):** renamed from `onDaggerHit`, because some items apply on-hit effects at other times too (Dusk and Dawn's repeat, later Guinsoo's Phantom hit). Those call `applyOnHitEffects()`, which runs every item's `onHit` once more.
- **Each item makes a fresh effect for every simulation (`createEffect`):** Spellblade remembers "already used", and a leftover memory from the previous build would give wrong numbers. A test checks this.
- **Resist shred from items is reported by each item (`shred(time)`), not written into Katarina's stats (Step 5d-3):**
  - Each time damage is calculated, the simulation adds every item's shred to Katarina's own pen (`addShred`). Flat amounts add; percentages multiply, like two % pens.
  - Chose this over letting items edit `attacker.armorShred` because two items could overwrite each other, and the simulation only copies the top layer of the attacker, so a change to the pen numbers one layer down would leak into the next build's simulation.
  - Debuffs on the dummy (Black Cleaver's armor reduction) count the same way. With one target, it doesn't matter whose side they're on.
  - `shred` gets the time of the damage, so "only counts after the hit" rules (Bloodletter's, Malignance, Terminus) compare times.
- **Two more hooks, `beforeDamage` and `afterDamage` (Step 5d-3):** run around every piece of damage, R's or an item's. Black Cleaver needs "before" (R's hit benefits from its own stack); the rest use "after". 0-damage pieces (R's AD part with no bonus AD) don't run them, since no damage was really dealt.
- **One more hook, `onUltCast` (Step 5d-5a):** runs once at time 0, before the first dagger. Zeke's uses it, because its storm starts when R is cast, not when damage lands.
- **Burns and Immolate auras share one helper, `src/items/ticking.ts` (Step 5d-5a):** "some damage turns it on, every new trigger keeps it on for N more seconds, and it ticks every X seconds while on". Each tick books the next one with `schedule`, so a burn that isn't refreshed stops by itself.
- **Katarina's stats include `baseHealth` (Step 5d-5a):** bonus HP = max HP − base HP, for Sunfire and Hollow Radiance.
- **The amp test helper (`ampRatios`) skips the item's own damage pieces:** Liandry's burn has no "without the item" piece to pair with.
- **"More damage" items use one more hook, `damageMultiplier` (Step 5d-4):** each item returns what to multiply a piece of damage by. The simulation multiplies them all together, after armor / MR.
- **Amp items have no line of their own in the "by source" breakdown (Eric chose A, Step 5d-4):** they make the base / AP ratio / item lines bigger instead. Their value shows in the marginal damage line (with the item minus without it). Chose this over giving each amp its own line because, when 3 amps multiply together, there's no fair way to say which one caused which part of the extra damage.
- **The dummy has a `bonusHp` number (Step 5d-4):** the HP from its items, for Lord Dominik's. When the user types in HP (Step 7), bonus HP = typed HP − the champion's own HP at that level, and never below 0. Its max HP is just its starting HP (`targetMaxHp`), for Shadowflame.
- **Shadowflame checks HP per piece of damage:** R's base and AP ratio pieces of one dagger are one hit in the game, so if the base piece crosses 40%, the AP ratio piece gets the bonus a moment early. That's at most one dagger's AP part per ult, so we accept it.
- **"Same time" = "same frame" = "same hit":** a dagger's magic damage is stored as 2 pieces (base, AP ratio) for the breakdown, but it's one hit, so stack rules check the time to add only 1 stack per dagger.
- **The 5 Spellblade items share one helper (`src/items/spellblade.ts`)** for "first dagger only, × R's effectiveness"; each item file only says its own damage formula.
- **Rod of Ages' extra level raises Katarina's stats but not R's rank:** R rank is its own input (Step 7a), checked against her real level.
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
- **Look and feel (Eric, after the polish pass):** the system font and big rounded corners looked generic.
  - The font is Rubik, a friendly normal-width font used for everything. It's free under the SIL Open Font License, and the files are saved in `public/fonts/` with the licence, so nothing loads from Google.
    - Barlow with Barlow Condensed was tried first. Eric found the condensed numbers and the heavy uppercase headings too long and skinny.
    - IBM Plex Sans was tried next. Eric found it too formal and pointy.
  - Corners are 2–4 px everywhere. There are no pill or circle shapes, no gradients and no glow.
  - Damage types use the game's colours: purple for magic and orange for physical (teal for true). A breakdown label is coloured only when its source dealt a single damage type.
    - To support this, `breakdown()` now also records `typesBySource`.
    - Ability vs. items moved to blue and pink, so purple only ever means magic.
    - All the colours passed the colour-blind validator in both themes, and the text colours have at least 4.5:1 contrast.
  - The top builds show the total cost in gold text with the game's coin icon. The coin comes from Data Dragon 5.5.1, the last version with UI icons, and `update-icons.mjs` saves it.
- **"Best build for each stat" under the top 5 (Eric asked for "prioritize AP / AD"):**
  - "Prioritize" is defined as: the best build where every legendary gives that stat. There are three styles: AP, AD and attack speed (`src/optimizer/styles.ts`).
    - This is easy to explain and to check, and it answers the site's founding question (AD, AP or on-hit Katarina?) even when one style fills the whole top 5.
    - Rejected: weighting stats with points (any weights would be made up), and "most AP" (it ignores damage).
  - It runs the same search again, with every legendary that lacks the stat added to the bans.
    - Boots are untouched: they have their own slot.
    - The user's locked items stay, even if they lack the stat.
    - When a style's best build is already in the top 5, its row says "same as #N".
  - Cost: Full-stage Optimize takes about 5.5 s instead of 3.4 s (measured in Node). The loading bar gives the main search 85% and the three style searches the rest.
- **Ambience (Eric: "kind of boring"):**
  - Each champion's splash art sits behind the top of their page, faded and fading out downwards. Riot calls this version "centered"; it's cropped for banners.
    - At first only Katarina had one, to keep the repo small. When every champion got the full page (below), all 173 were saved: about 18 MB.
    - Fiddlesticks has no "centered" splash, so the script falls back to the normal one.
  - **The splash is one of the champion's best skins (Eric), not the default.**
    - Data Dragon lists skins but not their tier, so the tiers come from CommunityDragon, a community copy of the game's files.
    - The rule: highest tier first (Ultimate / Exalted / Transcendent, then Mythic = Prestige, Legendary, Epic), newest among equals. Katarina gets Prestige Masque of the Black Rose; Lux gets Elementalist; Ezreal gets Pulsefire.
    - `splashOverrides` in `update-icons.mjs` picks a different skin for any champion (slug → skin number).
    - Katarina uses Battle Queen Katarina (skin 29, Eric's pick) instead of the automatic Prestige Masque of the Black Rose. Her page colour follows it (a crimson-pink from the armor).
    - The page credits the skin in the top-right corner. CommunityDragon is listed under Sources; `sources.test.ts` allows it for that one entry only, since it never supplies a game number.
- **Each champion page takes its colours from the splash art (Eric).**
  - Picked once, when the icons are downloaded (`scripts/splash-colors.mjs`, run by `update-icons.mjs`), and saved as `splashColor` in the champion list. Chose this over picking the colour in the browser on every visit because the colours are ready before the page draws (no flash of red first), and they can be tested.
    - Reading a .jpg's pixels needs `jpeg-js` (a dev dependency, approved by Eric). Only the script uses it; visitors never download it.
  - How the colour is picked: skip greys, near-blacks and near-whites, sort the rest into 36 hue buckets, and let each pixel count chroma³ (vivid pixels count far more). Plain chroma picked skin and background browns; chroma³ finds small glowing accents (Aurora's green, Hecarim's teal-gold).
  - Nearly black-and-white splashes (Elise, Lillia, Swain, Sylas on 26.23) get no colour and keep the normal red. `colorOverrides` in the script sets a colour by hand.
  - `src/ui/champion-colors.ts` keeps the colour's hue and picks its lightness, so it's always readable: it gets lighter on the dark theme and darker on the light theme until it passes the WCAG contrast check (4.5 for text, 3 for shapes). A test checks every champion in both themes.
  - Only the accent variables change (`--accent`, `--accent-strong`, `--accent-soft`, `--bg-glow`, `--on-accent`). The damage-type colours never change (magic is always purple). Warnings got their own fixed `--warning` red, so they still look like warnings on a teal page.
  - Button text is white when readable, otherwise near-black (gold, teal and light-green buttons).
  - New patch: re-running `update-icons.mjs` re-picks the colours from the new splashes in the same run, so a colour can never belong to an old splash.
- **Every champion gets the full page (Eric):** splash, portrait, and all 4 abilities with icons, names on hover and rank boxes, all "coming soon" like Katarina's Q / W / E. Clicking an ability picks it (`/aatrox/q`).
  - The ability names and rank counts come from Data Dragon, saved into the champion list by `update-icons.mjs`. Ranks vary: Udyr has 6 on every ability, Elise's R has 4.
  - That's display only: Data Dragon's ability numbers stay unused (unreliable), so a champion the site calculates still gets its own data file from the wiki.
  - A test checks that Katarina's names and ranks agree between the two.
  - The damage total counts up to its new value (`src/ui/count-up.ts`, 0.35 s). It's skipped when the visitor's system asks for reduced motion.
- **The casino roll (Eric):** `src/ui/slot-roller.ts`. While Optimize runs, every free item slot flicks through random item icons, with a gold rim.
  - When the answer arrives, the slots stop left to right, 170 ms apart, each with a small bounce. Only then do the damage total (counting up) and the top 5 change.
  - Locked slots never roll.
  - It's decoration only: the answer is already worked out before the first slot stops. It's skipped for reduced motion, and a change made mid-roll cancels it.
- **The two input panels are balanced:** the dummy's level moved into the stat row (Level, HP, Armor, MR), and the Recommended switch moved beside the dummy's "Items" label.
  - Before, the dummy panel was ~90 px taller, and the stretched "Your build" panel had a big empty gap.
  - The stage buttons now fill their box.
- **Number boxes have big ▲ / ▼ buttons (Eric):** each press changes the number by a useful step (levels 1, HP 100, armor and MR 10) and counts as typing it. The browser's tiny arrows are hidden.
- **Each hand-typed source records the patch it was last CHECKED on (`patch: "26.23"`), not `patch: PATCH`.** Patch day, step 1 of 4.
  - Before, every source borrowed `PATCH`, so bumping the patch would have made every number claim the new patch, even ones nobody re-checked.
  - `tests/patch-check.test.ts` reads the text of every file in `src/` and finds each `patch: "..."`, including ones never shown on the site (`bugSource`, `daggerSource`). It fails when:
    - a source borrows a variable instead of writing the patch out
    - a source is older than `PATCH`. The failure lists each file and line to re-check.
  - Snapshot sources (items, champion list) keep `snapshot.patch`: the download scripts write it, so it's always true.
  - Comments like "measured in the Practice Tool (patch 26.23)" are history and stay as they are.
- **Patch day is one command (Eric): `/patch-day` in Claude Code, or `npm run patch-day` for the automatic part only.**
  - `scripts/patch-day.mjs` asks Data Dragon for the newest version. If it's a new patch, it:
    - changes `PATCH` and the snapshot file names, downloads items, icons and splash colours
    - lists item changes (`scripts/patch-diff.mjs`) and wiki changes (`scripts/check-wiki.mjs`)
    - runs the tests and writes everything into `patch-report.md` (not committed)
  - It never edits a hand-typed number: that's for a person, or Claude following `.claude/commands/patch-day.md`, which says exactly how to work through the report and when to stop and ask Eric.
  - `patch-diff.mjs` sorts item changes by the item's checklist status: hand-coded items first ("check these"), then new, removed, changed passive text on irrelevant items, and stats-only changes (nothing to do: the site reads stats from the snapshot).
  - **`check-wiki.mjs`: why we watch the wiki.** The site never reads the wiki by itself, so a wiki change (say Death Lotus's AP ratio) would go unnoticed. `wiki-watch/` keeps a saved copy of every wiki text our numbers come from (180 pieces); the script shows a line-by-line diff of what changed since.
    - It finds what to watch by itself: every wiki link in `src/`, plus each linked champion's block in `Module:ChampionData/data` (where the wiki keeps base stats) and each snapshot item's block in `Module:ItemData/data` (stats, passive text, item groups). Ability pages are listed in `abilityPages` in the script; add one when a new ability is modelled.
    - Chose "save a copy and diff it" over reading specific numbers out of the wiki because the ability pages are formatted text (`{{ap|25 to 50}} {{as|(+ 19% AP)}}`): reading them reliably would need a parser per template, and a diff catches every change, including notes about interactions.
    - Wording edits show up too; they're quick to skim.
    - `--accept` saves the wiki as it is now. Run it only when every listed change is handled: the saved copies mean "the site agrees with this".
    - First copies saved 2026-11-24, after checking that Katarina's and the 3 dummy champions' stats and Death Lotus's numbers on the wiki match our files exactly. Item passives were checked against the wiki in Step 5 (patch 26.23).
    - The wiki limits how fast scripts can ask (it answered 429 "too many requests" while this was being tested). The script asks for one page at a time with a short pause, and waits and retries on 429.
    - Riot writes "Blade of The Ruined King", the wiki "Blade of the Ruined King", so names are matched ignoring upper/lower case.
  - Data Dragon numbers versions the old way: 16.24.1 = patch 26.24 (first number + 10). The script checks this rule against the current snapshot before trusting it.
  - **Practice Tool measurements stay valid until a patch changes something they depend on (Eric: no re-measuring everything every 2 weeks).** This replaces the Step 8 rule ("any patch change = redo every test").
    - Every case depends on Katarina, Death Lotus, the game rules and the Practice Tool dummy. Each case also depends on its own items.
    - On patch day, each case is checked against what changed. Out-of-date cases go into `needsRemeasuring` (in `tests/practice-tool-cases.ts`) with the reason, and are skipped until Eric redoes them, whenever he likes. Then `stillValidOnPatch` moves to the new patch.
    - The test fails only while `stillValidOnPatch` is behind the site's patch, meaning nobody has checked yet.
    - Out-of-date cases are skipped, not compared: an old measurement can't prove new numbers right or wrong.
    - Trade-off: if a patch changes Katarina herself, every case is out of date and the site has no in-game check until something is re-measured. Cases 1-3 (no items) take ~2 minutes and restore a basic one.
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
- **R rank follows the game's level rule** (wiki: R is ranked up at 6 / 11 / 16): levels 6-10 allow rank 1 only, 11-15 up to rank 2, 16+ up to rank 3. Stage presets pick the highest rank (Early = 1, Mid = 2, Late and Full = 3); the user can pick a lower one.
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
- **Rolling item slots looked empty (caught in the browser before Eric saw it).**
  - Bug: during the casino roll, the item slots showed blank squares. Only the boots slot showed icons.
  - Cause: Optimize redraws the results ~100 times. Each redraw rebuilt the slots with brand-new pictures that the browser hadn't painted yet, so it kept showing empty frames.
  - Fix: the slots are only rebuilt when their HTML actually changes. A rolling slot always starts with the same picture, so redraws during a roll change nothing. The roller also only swaps in icons that have finished loading.
- **Changing any input made the whole page jump (Eric).**
  - Bug: after every change, the slots, top 5 and breakdowns vanished for a moment and came back. The page shrank by about 770 px, then grew again, which felt like a full page refresh.
  - Cause: the page only shows a result whose key matches the current inputs. Between a change and its quick answer (~15 ms) there was none, so the results were blanked.
  - Fix: while a new answer is on its way, the previous one stays on screen. It fades only if the wait lasts longer than 150 ms.
    - The check is "there's a quick question and no error", not "a search is running", because the page redraws just before the search starts.
    - Measured frame by frame in the browser: the top 5 never disappear and the scroll position never moves.
- **Every test file failed with "Vitest failed to find the current suite" when run from Git Bash.**
  - Bug: `npm test` in Git Bash loaded 0 tests per file, while the same command in PowerShell passed all 292.
  - Cause: not our code. It's most likely the Git Bash path (`/c/Users/...`) making Vitest load itself twice.
  - Fix: run the tests from PowerShell, or from VS Code's default terminal.
- **"Slot counts" search test sometimes failed in the full suite (Step 8).**
  - Bug: passed on its own, failed now and then in `npm test`.
  - Cause: it runs 3 searches, ~5 s when all 60 test files run at once, and Vitest stops any test after 5 s by default.
  - Fix: the heavier search tests get a 60 s limit, like the Full test already had.
- **Dream Maker vanished from Nami's custom item picker (Step 7b, caught in the browser before commit).**
  - Bug: unticking "Use recommended items" on Late Nami showed Echoes of Helia, Ardent Censer and an empty slot.
  - Cause: Dream Maker is a *support* item (`category: "support"`), and the picker only kept `"legendary"` items.
  - Fix: the dummy picker keeps every non-boots item and lists support items too. A test checks Late Nami's custom list equals her recommended list.
- **Malignance test compared against the wrong "raw" damage (Step 5d-3, caught before commit).**
  - Bug: the test said dagger 2 did 26.3 damage but expected 28.7.
  - Cause: the test used a 0 MR dummy for "damage before MR". But Malignance's −10 MR took that dummy to −10 MR, and negative MR *raises* damage, so the "raw" numbers were 9% too high. The item was right; the test was wrong.
  - Fix: Malignance's tests use a 100 MR dummy only and compare daggers with each other.
- **Garbled "×" signs in `tests/simulation.test.ts` (found in Step 5d-4, already in the 5d-2 commit).**
  - Bug: two comments showed "Ã—" instead of "×".
  - Cause: in 5d-2, removing a BOM (a hidden marker PowerShell adds at the start of files) read the file with the wrong text encoding, so "×" turned into two other characters. Only comments were affected.
  - Fix: put the "×" signs back, and searched every file for the same garbling (none left). Lesson: write files with the editor or node, not PowerShell.
- **Liandry's, Blackfire's and Luden's damage about 3× too high; Eclipse wrongly "irrelevant" (found in Step 5d-6, fixed as 5d-5c).**
  - Bug: those items were coded at full damage, and Eclipse was marked as never procing from R.
  - Cause: we only read the item pages. The notes on R's own data page (`Template:Data_Katarina/Death_Lotus`) list a bug where R's on-hit effectiveness also shrinks those 3 items, and say each dagger counts as a separate hit for Eclipse.
  - Fix: those 3 items now multiply by R's on-hit effectiveness, and Eclipse is modelled. Lesson: for every new effect, also read the ability's own data page notes.

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
| Swiftmarch | modelled | "Noxian Fervor": adaptive force = 5% of total move speed (with soft caps, including Hexplate's Overdrive), as AD or AP. `src/items/swiftmarch.ts`. |

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
| Bastionbreaker | modelled | "Shaped Charge": dagger 1 deals 40 + 1.5 per lethality bonus true damage (melee). "Sabotage" needs a takedown: irrelevant. `src/items/bastionbreaker.ts`. |
| Black Cleaver | modelled | "Carve": physical damage gives a stack (−6% armor each, up to −30%), one per dagger. R's own hit benefits from its own stack (wiki). `src/items/black-cleaver.ts`. |
| Blackfire Torch | modelled | "Baleful Blaze": R's damage starts a burn, 10 + 1% AP every 0.5 s, refreshed by every dagger (5 ticks inside the ult), shrunk by R's % (Death Lotus bug). "Blackfire": +4% AP while it burns (from dagger 2), added to Rabadon's 30%. `src/items/blackfire-torch.ts`. |
| Blade of The Ruined King | modelled | On-hit 9% (melee) of the dummy's current HP, physical (1 HP after the overkill point). `src/items/blade-of-the-ruined-king.ts`. |
| Bloodletter's Curse | modelled | "Vile Decay": R's magic damage gives a stack (−7.5% MR each, up to −30%), one per dagger, counting from the next hit. `src/items/bloodletters-curse.ts`. |
| Bloodthirster | checked, irrelevant | Shield. |
| Chempunk Chainsword | checked, irrelevant | Grievous Wounds; the dummy doesn't heal. |
| Cosmic Drive | checked, irrelevant | Move speed. |
| Cryptbloom | checked, irrelevant | Needs takedowns. Its pen stat counts. |
| Dawncore | checked, irrelevant | AP per 100% base mana regen, but manaless champions "do not use nor benefit from mana or mana regeneration" (wiki: Manaless). Its plain AP counts. |
| Dead Man's Plate | modelled | Momentum full at R cast, used by dagger 1: 40 + 100% base AD physical on-hit, × R's %. Katarina doesn't move while channeling, so it never refills. `src/items/dead-mans-plate.ts`. |
| Death's Dance | checked, irrelevant | Defensive. |
| Dusk and Dawn | modelled | Spellblade, first dagger only: 75% base AD + 10% AP magic, then all on-hit effects once more 0.2 s later. `src/items/dusk-and-dawn.ts`. |
| Echoes of Helia | checked, irrelevant | Needs healing allies. |
| Eclipse | modelled | "Ever Rising Moon": the Death Lotus page says each dagger counts as a separate hit, so dagger 2 procs it: 8% of the dummy's max HP as physical damage, once (6 s cooldown). Not shrunk by R's %. `src/items/eclipse.ts`. (Was "checked, irrelevant" until Step 5d-5c.) |
| Edge of Night | checked, irrelevant | Defensive. |
| Endless Hunger | checked, irrelevant | Needs takedowns. |
| Essence Reaver | modelled | Spellblade, first dagger only: 125% base AD + 0.5 per 1% crit chance, physical. `src/items/essence-reaver.ts`. |
| Experimental Hexplate | modelled | "Overdrive": casting R gives +50% bonus attack speed (raises R's AD part) and +20% move speed (Swiftmarch counts it) for the whole ult. A stat passive. `src/items/experimental-hexplate.ts`. |
| Fiendhunter Bolts | checked, irrelevant | Empowers basic attacks after R. |
| Force of Nature | checked, irrelevant | Defensive. |
| Frozen Heart | checked, irrelevant | Defensive. |
| Guardian Angel | checked, irrelevant | Defensive. |
| Guinsoo's Rageblade | modelled | "Wrath": 30 magic on-hit. "Seething Strike": daggers 1-4 give +8% attack speed each (from the next dagger); Phantom Hits (every on-hit effect again, 0.15 s later, at R's %) after daggers 7, 10, 13. `src/items/guinsoos-rageblade.ts`. |
| Heartsteel | checked, irrelevant | "Colossal Consumption": 1 stack per second near the dummy, procs at 3. Stacks start at 0 when R is cast (Eric, Step 5d-6), so the 3rd comes at 3 s, after the ult. Permanent HP stacks also start at 0. |
| Hexoptics C44 | checked, irrelevant | Increases *basic attack* damage only. |
| Hextech Gunblade | checked, irrelevant | Active only. |
| Hextech Rocketbelt | checked, irrelevant | Active only. |
| Hollow Radiance | modelled | "Immolate": 15 + 1% bonus HP magic damage every second (2 ticks inside the ult). "Desolate" needs a kill: irrelevant. `src/items/hollow-radiance.ts`. |
| Horizon Focus | checked, irrelevant | Needs 600+ range; R's daggers only reach 550. |
| Hubris | checked, irrelevant | Needs takedowns (starts at 0 stacks). |
| Hullbreaker | modelled | "Skipper": every 5th on-hit (daggers 5, 10, 15) deals 120% base AD + 5% of Katarina's max HP physical, × R's %. `src/items/hullbreaker.ts`. |
| Iceborn Gauntlet | modelled | Spellblade, first dagger only: 150% base AD physical. `src/items/iceborn-gauntlet.ts`. |
| Immortal Shieldbow | checked, irrelevant | Defensive. |
| Imperial Mandate | checked, irrelevant | Needs an immobilize; R has none. |
| Infinity Edge | checked, irrelevant | No passive. Crit stats do nothing: abilities and on-hit can't crit. |
| Jak'Sho, The Protean | checked, irrelevant | Defensive. |
| Kaenic Rookern | checked, irrelevant | Defensive. |
| Knight's Vow | checked, irrelevant | Needs an ally. |
| Kraken Slayer | modelled | "Bring It Down": every 3rd on-hit (daggers 3, 6, 9, 12, 15; Phantom Hits add stacks) deals 150-200 physical by level, up to +75% by missing health, × R's %. `src/items/kraken-slayer.ts`. |
| Liandry's Torment | modelled | "Torment": burn, 1% of the dummy's max HP every 0.5 s, refreshed by every dagger (5 ticks inside the ult), shrunk by R's % (Death Lotus bug). "Suffering": +2% damage per second in combat, up to 6%, starting at 0 when R is cast. `src/items/liandrys-torment.ts`. |
| Lich Bane | modelled | Spellblade, first dagger only (Eric, from playing): 75% base AD + 45% AP magic. `src/items/lich-bane.ts`. |
| Locket of the Iron Solari | checked, irrelevant | Active only. |
| Lord Dominik's Regards | modelled | "Giant Slayer": 1% more damage per 100 of the dummy's BONUS HP (from items), up to 15%. `src/items/lord-dominiks-regards.ts`. |
| Luden's Echo | modelled | "Echo": 6 stacks, full at R cast, used by dagger 1: 75 + 5% AP, then 5 × (15 + 1% AP) every 0.25 s (one enemy, so every leftover stack hits it). All shrunk by R's % (Death Lotus bug). `src/items/ludens-echo.ts`. |
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
| Rabadon's Deathcap | modelled | "Magical Opus": +30% of ALL AP, including AP from other passives. Other % AP (Blackfire) adds to the 30%. `src/items/rabadons-deathcap.ts`. |
| Randuin's Omen | checked, irrelevant | Defensive. |
| Rapid Firecannon | modelled | Energized (full at R cast, used by dagger 1, never refills during the ult): 40 magic on-hit, × R's %. `src/items/rapid-firecannon.ts`, `src/items/energized.ts`. |
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
| Statikk Shiv | modelled | Energized (dagger 1 only): chain lightning 60 magic, NOT shrunk by R's % (wiki: "not affected by on-hit damage modifiers"). One dummy, so one bounce. `src/items/statikk-shiv.ts`. |
| Sterak's Gage | modelled | "The Claws that Catch": bonus AD = 50% of base AD, which counts for R. `src/items/steraks-gage.ts`. |
| Stormrazor | modelled | Energized (dagger 1 only): 100 magic on-hit, × R's %. `src/items/stormrazor.ts`. |
| Stormsurge | modelled | Deal 25% of the dummy's max HP → lightning strike 2 s later, 125 + 10% AP magic. Only lands inside the ult if triggered by 0.5 s. `src/items/stormsurge.ts`. |
| Stridebreaker | checked, irrelevant | Cleave hits only other enemies; active doesn't count. |
| Sundered Sky | checked, irrelevant | Empowers the next *basic attack*. |
| Sunfire Aegis | modelled | "Immolate": 20 + 1.5% bonus HP magic damage every second (2 ticks inside the ult). `src/items/sunfire-aegis.ts`. |
| Terminus | modelled | "Shadow": on-hit 30 + 10% bonus AD + 10% AP magic. "Juxtaposition": Dark hits (2nd, 4th, 6th on-hit) give +10% armor and magic pen each, up to 30%. `src/items/terminus.ts`. Check: see "Unconfirmed". |
| The Collector | checked, irrelevant | Execute below 5% HP; under our overkill rule the dummy never dies. Its lethality stat counts. |
| Thornmail | checked, irrelevant | Reflects damage Katarina takes. Its HP stat counts (Riftmaker). |
| Titanic Hydra | modelled | "Cleave": on-hit 1% (melee) of Katarina's max HP, physical. `src/items/titanic-hydra.ts`. |
| Trinity Force | modelled | Spellblade, first dagger only: 200% base AD physical. `src/items/trinity-force.ts`. |
| Umbral Glaive | checked, irrelevant | Needs Katarina unseen; Death Lotus reveals her. |
| Unending Despair | checked, irrelevant | "Anguish": the first sap comes 4 s after combat starts (R cast), after the 2.5 s ult ends. |
| Void Staff | checked, irrelevant | No passive. Its 40% magic pen stat counts. |
| Voltaic Cyclosword | modelled | "Galvanize": R's first damage triggers the Energized effect (before that damage, not shrunk): 8% of the dummy's current HP physical + 15 lethality for the whole ult. `src/items/voltaic-cyclosword.ts`. |
| Warmog's Armor | modelled | "Warmog's Vitality": +12% of items' plain HP stats (not HP from item passives). Matters with Riftmaker / Overlord's. `src/items/warmogs-armor.ts`. |
| Winter's Approach | checked, irrelevant | HP from mana, but Katarina has no mana. |
| Wit's End | modelled | On-hit 45 magic damage. `src/items/wits-end.ts`. |
| Youmuu's Ghostblade | checked, irrelevant | Move speed; active doesn't count. |
| Yun Tal Wildarrows | modelled | "Flurry": dagger 1 gives +30% attack speed for daggers 2-15. Crit stacks start at 0 and crit doesn't affect R. `src/items/yun-tal-wildarrows.ts`. |
| Zeke's Convergence | modelled | "Frostfire Tempest": casting R starts a storm: 7.5 magic damage every 0.25 s (10 ticks inside the ult). `src/items/zekes-convergence.ts`. |
| Zhonya's Hourglass | checked, irrelevant | Active only. |
