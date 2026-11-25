# Project notes

These notes are for anyone joining the project.
- `CLAUDE.md` says what the project is and lists its rules.
- `PLAN.md` is the step-by-step plan for version 1.
- `PLAN-ranged-champions.md` was the plan for Lux, Caitlyn, Veigar and Ezreal, with Eric's decisions. It's done (Nov 25, 2026).
- "Adding a champion" (below) is the checklist for the next one.
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

- **Q and E added (Nov 24, 2026, Eric).** Katarina's Bouncing Blade (Q) and Shunpo (E) can be optimized like R; W shows "deals no damage".
  - The simulation no longer knows about Death Lotus: `src/simulation/abilities.ts` describes each ability as data (`AbilityCast`: when its hits land, their damage, on-hit or not, its damage window), and `simulateCast` in `simulate.ts` runs any of them. `simulateDeathLotus` is kept as a short wrapper so the old tests still work.
  - Proof R didn't change: every existing test passed unchanged after the refactor, including the Practice Tool measurements.
  - Rank rules and the skill order: `src/stats/ability-ranks.ts`. The search takes `ability` + `rank` instead of `rRank`.
  - New tests: `tests/ability-ranks.test.ts`, `tests/basic-abilities.test.ts`. The filter and beam checks (fast and slow) now run for Q, E and R.
  - To do: add Q and E Practice Tool cases (nothing measured for them yet), and run `npm run check-wiki` to save first copies of the two new ability pages.

- **Akali (started Nov 24, 2026, Eric).** Plan: 1) make the code work for more than one champion, 2) `akali.ts` data, 3) Q and E, 4) R with its missing-health boost, 5) the about page, notes and scope.
  - Step 1 (more than one champion) is done. Nothing about Katarina's numbers changed: the same 343 tests pass.
    - `src/data/playable-champions.ts` lists the playable champions. `ChampionKit` is the part of a data file the shared code reads (stats, ability list, skill order, adaptive type, melee/ranged).
    - `katarinaStats` became `championStats(champion, level, items, ability)` in `src/stats/champion-stats.ts`. `rRankAtLevel` and `allowedRRanks` moved to `ability-ranks.ts`.
    - Katarina's casts moved to `src/simulation/katarina-abilities.ts`. `abilities.ts` now only picks the right champion's file.
    - `simulateBuild`, `explainBuild`, `stagePreset` and `recommendedRanks` take the champion first. The search's setup (`ChampionSetup`) has a `champion` field.
    - Per champion: which abilities are modelled, the "deals no damage" text and the one-line damage rule under the total.
    - Opening another champion's page keeps the settings, but resets the ranks to that champion's skill order (`selectChampion` in `state.ts`).
  - Steps 2-5 are done: `src/data/akali.ts`, `src/formulas/perfect-execution.ts` (R2's bonus), `src/simulation/akali-abilities.ts`, the about page, sources and wiki watch list. Decisions are under "Akali" in Decisions.
    - The simulation now tells each hit which hit it is and the dummy's current HP (`HitInfo`), so R2 can read the dummy's missing health.
    - New tests: `tests/akali.test.ts`, `tests/items/unending-despair.test.ts`, Akali cases for Eclipse, Malignance and Stormsurge. The filter and beam checks (fast and slow) run for every champion's Q, E and R.
    - Checked in headless Chrome: /akali/r, /akali/e, /akali/w and /about render, and the optimizer gives results.
    - To do: Practice Tool cases for Akali (see "Unconfirmed"), and `npm run check-wiki -- --accept` once, to save first copies of her 3 ability pages and her champion data.

- **Yone (Nov 24, 2026, Eric).** Q (Mortal Steel), W (Spirit Cleave) and R (Fate Sealed) are calculated; E (Soul Unbound) "deals no damage by itself". Decisions are under "Yone" in Decisions.
  - `src/data/yone.ts` (data), `src/simulation/yone-abilities.ts` (his casts). His passive's crit rules are in `championStats` (`critPassive` in the data file).
  - New for every champion: an ability can crit (`abilityCanCrit`), W can deal damage (`modelledAbilities` per champion), and a hit can be basic damage instead of ability damage (`basicDamage` on the cast, `abilityDamage` on each piece of damage).
  - Katarina's and Akali's numbers didn't change: the same 370 tests pass.
  - New tests: `tests/yone.test.ts` (data, passive, each ability, the crit average, basic damage vs. items). The filter and beam checks (fast and slow) now also run for Yone's Q, W and R.
  - To do: Practice Tool cases for Yone (see "Unconfirmed"), and `npm run check-wiki -- --accept` once, to save first copies of his 4 ability pages and his champion data.

- **Garen (Nov 24, 2026, Eric).** Q (Decisive Strike), E (Judgment) and R (Demacian Justice) are calculated; W (Courage) "deals no damage". Decisions are under "Garen" in Decisions.
  - `src/data/garen.ts` (data), `src/simulation/garen-abilities.ts` (his casts).
  - New for every champion (all optional, so nothing changed for Katarina, Akali and Yone):
    - A cast is built with the champion's stats (`abilityCast(..., attacker)`), so E can count its spins from bonus attack speed.
    - A piece of damage can be ability damage inside a basic attack (`DamagePart.abilityDamage`: Q's bonus).
    - A cast can reduce the dummy's armor after N hits (`AbilityCast.armorReduction`: E's 25% after 6 spins).
    - A cast can be ONE cast instance with many hits (`AbilityCast.oneCastInstance`: Eclipse gives one stack for E).
    - The dummy can start below full health (`Target.startHpShare`), from a new "Health %" box in the dummy panel. It works for every ability of every champion (Eric, see Decisions).
  - New tests: `tests/garen.test.ts`. The fast filter and beam checks run for his Q, E and R automatically.
  - To do: Practice Tool cases for Garen (see "Unconfirmed"), Sundered Sky (see the checklist), and `npm run check-wiki -- --accept` once.

## Confirmed in the Practice Tool (Step 8, patch 26.23)
- **Within one dagger: on-hit effects → R's own damage → on-attack effects** (HP bar, test 17). Was assumed the other way round.
- **Burns tick right away, then every interval** (Liandry's, tests 12 and 20). Applied to every ticking effect (Liandry's, Blackfire, Sunfire, Hollow Radiance) at Eric's call; only Liandry's was measured.
- **Daggers give Guinsoo's stacks, and Phantom Hits come after daggers 7, 10, 13 at R's reduced %** (tests 16, 19 within 0.1%).
- **The Death Lotus bug shrinks Liandry's and Luden's damage** by R's %, and **Luden's fires once** (tests 12, 14, 21 within 0.1%).
- **On-hit at 25 / 30 / 35% by rank** (Nashor's, tests 9-11, exact).
- **The dummy's damage counter adds one R physical hit that never happened;** its HP bar is right (test 7b).
- **An AD build against 150 armor** (Lord Dominik's, Voltaic, BotRK, Guinsoo's, Yun Tal, Gunmetal Greaves; test 23, HP bar within 0.6%).
- **Statikk Shiv, Yun Tal, Kraken Slayer and Shadowflame together** (test 22, within 0.2%). Not checked one by one, so a small error in one could hide behind another, but none is big.

- **Ranged champions: Lux, Caitlyn, Veigar, Ezreal (Nov 25, 2026, Eric: "just do everything").** Built from `PLAN-ranged-champions.md`, plus a faster way to add champions. Decisions are under "Ranged champions" in Decisions.
  - **Abilities as data:** `src/simulation/ability-spec.ts`. A data file can list each ability as hits (time + parts: base by rank, AP / AD / bonus AD ratios, damage type) with optional flags (on-hit, on-attack, Spellblade, basic damage) and a `modifier` (`missingHealth`, `critChance`). All four new champions are data only: no `*-abilities.ts` file. Katarina, Akali, Yone and Garen keep their own code (nothing about them changed).
  - **`scripts/new-champion.mjs <Name>`** reads the wiki (champion data module + each ability's data template) and writes a draft `src/data/<slug>.ts`: stats, attack range, adaptive type, ability names, and each ability's numbers parsed from its "leveling" text, with the raw text kept as a comment. A person then sets the skill order, removes abilities that deal no damage and adds what the text can't say (hit times, flags, modifiers).
  - **Ranged support:** `rangeType` can be `"ranged"` with an `attackRange`. Item effects get a `Wielder` (`src/items/types.ts`: ranged or not, and the distance to the dummy), so items use their ranged numbers (BotRK, Eclipse, Hexplate, Titanic, Hullbreaker, Kraken, Voltaic, Bastionbreaker) and auras check their radius (Sunfire, Hollow Radiance, Abyssal Mask, Unending Despair). Runaan's Hurricane is buyable by ranged champions only. Horizon Focus and Hexoptics C44 (they need distance) are now modelled.
  - **Veigar's stacks box** (`stackPassive` in his data file, `stacks` in the page state and the search request).
  - Checked: `npm test` (all pass, plus `tests/ranged-champions.test.ts` and `tests/items/horizon-focus.test.ts`), `npm run test:slow`, `npm run build`. Not checked in a browser yet.
  - To do: Practice Tool cases for the four (see "Unconfirmed"), and `npm run check-wiki -- --accept` once, to save first copies of their ability pages and champion data.

## Unconfirmed: to check in the Practice Tool (Step 8)
- **Ranged champions (nothing measured yet).** Good first cases: Lux R with Abyssal Mask (aura reaches from 550?), Caitlyn E with Abyssal Mask (out of reach from 650?), Ezreal Q with Trinity Force (its own cast's Spellblade), Ezreal Q with Hexoptics C44 (+10%), and Lux R with Horizon Focus (+10% on the triggering hit).
  - **Distances:** we put the dummy exactly at the champion's attack range (edge to edge) and use a 65-unit radius for both. Auras are measured as the wiki says (Sunfire "centred", Abyssal Mask "centre to edge"). No case is within 100 units of a radius except Abyssal Mask vs. Caitlyn (715 vs. 700) and Unending Despair vs. 550-range champions (680 vs. 650).
  - **Kraken Slayer (ranged):** stacks on-attack, which we run right after the hit's damage, so its proc reads the dummy's health after that hit.
  - **Caitlyn's R crit bonus** = 30% × crit chance × (crit damage − 1): +30% at 100% crit, +39% with Infinity Edge (the wiki template's formula).
- **Akali (nothing measured yet).** Good first cases: R on a 1,000 HP dummy with no items (R2's bonus), and E with Eclipse.
  - **R2's timing:** we put R2 exactly 2.5 s after R1's hit. The wiki's 2.5 s "static cooldown" may count from R1's cast instead (R1 has a 0.25 s cast time), which would make it ~2.25 s after the hit. It changes which burn ticks land before R2 (its bonus) and the item window.
  - **R2's bonus uses the dummy's HP just before R2 lands,** and grows evenly up to +200% at 70% missing (the wiki table).
  - **Eclipse procs on E's recast** (2 casts = 2 stacks), never on R (2.5 s apart, over Eclipse's 2 s).
  - **Stormsurge counts R1 + R2 together** (exactly 2.5 s apart; we count damage exactly 2.5 s ago as "within 2.5 s").
- **Yone (nothing measured yet).** Good first cases: Q with 2 crit items (always crits: 125 + 199.5% AD), W on a 3,000 HP dummy, and Q with Trinity Force.
  - **Q uses Spellblade, at full strength, all physical.** The wiki's passive notes say Mortal Steel applies Spellblade (they list a bug about its damage type), but not whether the cast grants it before its own hit. We assume yes, like Katarina's E.
  - **Q is basic damage on the first target,** so Liandry's, Blackfire, Luden's, Spear of Shojin and Bastionbreaker don't trigger from it (wiki: "will not apply spell effects to the first target"). Voltaic's Energized proc comes from Q's on-hit instead (before Q's damage).
  - **Black Cleaver:** Q's stack goes on after Q (basic damage), so Q doesn't benefit from it. W and R benefit from their own stack, like every ability hit.
  - **R applies no on-hit effects** (Eric; the wiki doesn't say it does).
  - **Shadowflame's 120% on Yone's magic damage** isn't reduced by his 95% crit modifier (we assume the modifier is only for his own crits).
- **Garen (nothing measured yet).** Good first cases: Q with no items (attack + bonus), E with no items at level 1 and 18 (7 vs. 9 spins), R on a dummy at a known health.
  - **E's spins land at the end of each turn** (3/n, 6/n ... 3 s). The wiki says each spin deals damage "when the spin is completed", not the exact timing.
  - **E's spin count is fixed when E is cast** (the wiki doesn't say). Nothing in the item pool changes his bonus attack speed during E anyway.
  - **E's armor reduction starts with the 7th spin** ("Enemy champions hit 6 times ... are inflicted with 25% armor reduction").
  - **E applies no on-hit effects** (the wiki calls it "AOE DOT damage" and never mentions on-hit).
  - **Q uses Spellblade:** casting Q grants it and the empowered attack uses it. The wiki doesn't name Spellblade for Q.
  - **Q's attack applies on-attack effects** (Guinsoo's, Yun Tal...): it's a basic attack. The wiki only says "on-hit".
  - **Eclipse: E is one cast instance,** so it gives one stack and never procs on its own. The wiki only special-cases Zed (one stack per tick), which suggests other ticking abilities don't.
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
| `npm run test:slow` | The slow optimizer checks (about 1 hour since the ranged champions: 164 checks, 58 min on Nov 25, 2026): the beam search against trying every Late build, for each enemy type and every champion's abilities. Run it before each release and after changing item passives or the search. `npm test` skips these. |
| `npm run update-items -- 16.23.1` | Downloads Riot's item data and saves the snapshot `src/data/items.<patch>.json`. The number is Data Dragon's version for our patch. Only needed when the patch changes. |
| `npm run update-icons -- 16.23.1` | Downloads every champion, ability and item icon and the splash art, and picks each champion page's colour from its splash. Run it after `update-items`. |
| `npm run patch-day` | Patch day, the automatic part: switches to the newest patch, downloads everything, lists what changed (items and wiki) and runs the tests. Writes `patch-report.md`. In Claude Code, `/patch-day` runs this and then works through the report. |
| `npm run check-wiki` | Shows what changed on the wiki since the saved copies in `wiki-watch/`. `npm run check-wiki -- --accept` saves the wiki as it is now (only after every change is handled). |
| `npm run patch-diff` | Compares the two newest item snapshots. |
| `npm run new-champion -- Lux` | Reads a champion from the wiki and writes a draft data file `src/data/<slug>.ts` (never overwrites one). See "Adding a champion". |
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
- **Runaan's Hurricane is only for ranged champions** (Lux, Caitlyn, Veigar, Ezreal). Its bolts hit OTHER enemies, so on one dummy it's just its stats.
- **Mid quest = tier-3 boots, nothing else:** with the toggle on, the optimizer may pick tier-3 boots; with it off, they're not allowed. (Eric, Step 5c.)
- **Rules for item passives (Eric, Step 5c).** These are shown on the site with the other rules:
  - **Item actives don't count.** Clicking an item isn't part of the ability's damage.
  - **Combat starts when R is cast.**
  - **Stacks that fill up on their own are full** when R starts: Rod of Ages (grows each minute), Energized items and Dead Man's Plate (charge while walking).
  - **Stacks you earn by fighting start at 0:** Mejai's, Hubris, Heartsteel's permanent HP, and "per second in combat" stacks like Liandry's and Riftmaker. They can still build up *during* the ult.
  - **Katarina is right next to the dummy** (she usually blinks onto her target before ulting). So aura items like Sunfire Aegis reach it, and Horizon Focus (600+ range) never triggers. Every melee champion stands next to it; ranged champions stand at their attack range (see "Ranged champions").
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
- **Q and E: one hit, items count for up to 3 s after it (Eric: "for as long as items need").**
  - Chose a fixed 3 s cut-off over "until every effect ends" because Immolate (Sunfire, Hollow Radiance) never ends: the wiki says its own damage keeps it burning "infinitely". 3 s is the longest effect one hit starts (Liandry's and Blackfire burns), so everything else is counted in full. Sunfire gets ticks at 0, 1, 2 and 3 s.
  - Time 0 is the moment the hit lands, and combat starts then. Q's 0.25 s cast time and flight come before that, but nothing happens during them, so they change nothing.
  - Q bounces to up to 2 more enemies; with one dummy it hits once.
- **W (Preparation) shows "deals no damage" instead of modelling the dagger pickup (Eric).** W itself has no damage on the wiki; the damage is her passive (Voracity) when she picks a dagger up. Daggers on the ground aren't modelled anywhere, so Q and E don't count a pickup either.
- **Q / E details from the wiki (patch 26.23, `Template:Data_Katarina/...`):**
  - Q: 80 / 115 / 150 / 185 / 220 + 40% AP magic. The wiki lists no on-hit effects, so it applies none.
  - E: 20 / 30 / 40 / 50 / 60 + 40% AD + 25% AP magic, applies on-hit. "AD" = total AD (the wiki writes "bonus AD" when it means bonus). On-hit at full strength: the wiki gives no smaller number.
  - E and Spellblade: E's own hit uses the Spellblade that casting E grants, at full strength (Eric, from playing; the wiki doesn't say). First guessed "no" from the wiki's "Shunpo's effects occur before the cast time"; Eric corrected it. Q never procs it (no on-hit).
  - ASSUMPTION: E's hit runs in the same order as a dagger (on-hit first, then its own damage). The wiki doesn't say whether E applies on-attack effects; with a single hit it would change nothing anyway.
  - Items that work on the ULTIMATE only count for R: Malignance's zone, Zeke's storm, Experimental Hexplate's Overdrive.
  - The Death Lotus shrinking bug (Liandry's, Blackfire, Luden's × R's on-hit effectiveness) is R only: Q and E get those at full size. It's now its own number, `procEffectiveness`, next to `onHitEffectiveness`.
- **Burns stop AT their end time (changed with Q and E).** A burn on for 3 s ticking every 0.5 s ticks at 0, 0.5 ... 2.5: 6 ticks, matching the wiki (Liandry's "6% ... over 3 seconds"; Blackfire: first tick, then "the remaining 5 ticks"). Before, a tick exactly at the end also counted (7). It never mattered for R, because every dagger refreshes the burn.
- **Rank boxes follow the game's rules (replaces "basic ability rank rules are ignored for now").** A box that would break them is greyed out. Clicking the top filled box takes the point back, so points can be moved. Changing the level or picking a stage resets the ranks to the usual skill order.
- **Akali's recasts (Eric, Nov 24, 2026): she recasts as soon as the game allows.**
  - E (Shuriken Flip): the first cast and the recast both land at 0 s. The wiki gives no wait before the recast, only a 3 s window to use it.
  - R (Perfect Execution): R1 at 0 s and R2 at 2.5 s, because the wiki says "Perfect Execution can be recast after a 2.5-second static cooldown". (A static cooldown is a fixed wait that cooldown reduction can't shorten.) Burns ticking during those 2.5 s count toward R2's boost, as they would in a real game.
  - Chose 2.5 s over "instantly" (Eric's first idea): an instant recast is impossible in the game, and the wait changes R2's damage.
  - R2's boost is NOT the same for every build. It grows with the dummy's missing health, which depends on R1's damage (AD and AP), item damage before R2, and the dummy's HP. The simulation tracks the dummy's HP after every hit, so the boost is worked out exactly for each build.
- **Akali's R numbers (Eric, Nov 24, 2026):**
  - R1 is magic damage. The wiki contradicts itself: the text says physical, the damage table says magic. Eric, from playing: magic.
  - R2's boost: +2.86% per 1% of the target's missing health, capped at 70% missing health (= +200%). From the wiki's table, sent by Eric as a screenshot. The wiki's page text only says "0% – 200% (based on target's missing health)".
- **Akali's skill order: R whenever possible, then max Q, then E, then W (Eric).** Levels 1-3 take Q, E, W, like Katarina (our choice; only matters at levels 1-3).
- **Akali's data (patch 26.23; her numbers last changed in V26.17):**
  - Base stats from the wiki's champion data module (`Module:ChampionData/data`): HP 600 + 119, armor 23 + 4.7, MR 37 + 2.05, AD 62 + 3.3, attack speed 0.625 + 3.2% per level, move speed 345, melee, adaptive type Physical. Her page's "Special statistics" shows +121 HP per level: that's Arena only.
  - Q: 45 / 70 / 95 / 120 / 145 + 65% AD + 60% AP, magic. E1: 21 / 42 / 63 / 84 / 105 + 30% AD + 33% AP; E2: 49 / 98 / 147 / 196 / 245 + 70% AD + 77% AP (together = the wiki's total), magic. "AD" = total AD; the wiki writes "bonus AD" for R.
  - R1: 110 / 220 / 330 + 50% bonus AD + 30% AP, magic. R2: 70 / 140 / 210 + 30% AP, magic, × (1 + bonus).
  - None of her abilities apply on-hit (wiki: TriggerOnHitEvents "Not Owned"), so no on-hit items and no Spellblade (casting E or R grants it, but it needs an on-hit).
- **Akali's damage window: 3 s after her LAST hit (Q and E: 3 s; R: 5.5 s).** Chose the one-hit rule (Eric: item effects count "for as long as items need") over Katarina's channel rule, because Akali has no channel. R2 is the last hit, so effects it starts get the same 3 s as a Q.
- **The per-cast split.** Akali's E and R hits have names ("First cast", "Recast"). The "Ability vs. items" bar then shows one part per cast (new colour `--part-recast`), and R2's bonus is its own "Missing-health bonus" line in "By source".
- **Akali and the items (every item re-read for her):**
  - Unending Despair is now modelled: its first sap (4 s) lands inside Akali's R window.
  - Eclipse counts stacks per hit ("one per cast instance") instead of per moment, and checks the 2 s limit. Katarina is unchanged (one stack per dagger, dagger 2 procs it).
  - Malignance's −10 MR now ends with its 3 s zone (wiki: "removed as soon as the target loses the Curse"). Katarina's 2.5 s ult never reached 3 s.
  - Stormsurge's "25% within 2.5 s" is now a rolling window. For Katarina nothing changes: her ult is 2.5 s, and a later trigger can't land its strike inside the 3 s window of Q / E.
  - Luden's has a 12 s cooldown (wiki), so it can't recharge before R2.
  - Items that work "on your ultimate" (Malignance, Zeke's, Hexplate) work for Akali's R. Malignance makes one zone (its 3 s per-target cooldown blocks a second one from R2).
- **Yone's Q crits: show two numbers, rank by the average (Eric, Nov 24, 2026).** Chose this over "always crits" (wrong for builds without crit) and "average only" (hides the swing). The page shows Q's total without a crit and with a crit; the top 5's order and every breakdown use the average.
  - **Update (Eric, same day): no average as the headline.** The big total and each build card now show "no crit / crit", the crit number in red (`--text-crit`), like crit damage in the game. The average still ranks builds (more crit chance = more crits) and is named once in the line above the breakdowns.
  - At 100% crit chance only the red crit number is shown: Q always crits, so "no crit" can't happen (Eric). The big total remembers its layout (`data-layout`: one number, the pair, or crit only) and rebuilds itself when it changes; `showText` forgets the layout.
  - ~~How: the cast is simulated twice (no crit, crit) and every piece of damage is mixed by the crit chance.~~ Replaced by the next update.
  - **Update (Eric, same day): rank by the peak, not the average.** Chose "peak" because the site is about the biggest number a build can hit. A build with any crit chance is scored (and broken down) by its crit; at 0% crit chance by its no-crit cast, since it can never crit. `simulateBuild` now runs the crit cast when crit chance > 0 and the normal cast otherwise; `critTotals` still gives both numbers for the card. Trade-off: a build with a little crit chance scores the same as one with 100%, so crit items rank higher than under the average.
  - At 0% crit chance the page shows one plain number (no red crit number, no slash), like the other abilities.
- **Build cards: the damage column grows to fit (bug / cause / fix, Nov 24, 2026).** Bug: Yone's "no crit / crit" numbers ran into the item icons. Cause: the damage column was a fixed 1.5 × icon width, made for one number. Fix: the columns now belong to the list (`.top-builds`), and each card borrows them with CSS `subgrid`, so the damage column is as wide as the widest number in the list while the icons still line up from card to card. A `<wbr>` after the slash lets a narrow phone wrap the pair. Then 16 px still looked cramped (Eric), so `.build-damage` got `padding-right: var(--s4)`: 32 px after the widest number (not on phones, where the icons have their own row).
- **Every test file fails with "Vitest failed to find the current suite" (bug / cause / fix, Nov 24, 2026).** Cause: Windows drive-letter case. VS Code's terminal can start in `c:\...` (lowercase), and Vitest then loads itself twice (once as `c:`, once as `C:`). Fix: `cd C:\Users\...\lol-max` (capital C) before `npm test`. The code isn't the problem.
  - The crit's extra is its own "Critical strike" line in "By source".
  - Only Q's AD part grows on a crit (wiki: 25 / 50 / ... + 199.5% AD = 105% × 200% × 0.95).
- **Base crit damage is 200%** (`criticalStrike.baseDamage`): the wiki's Critical strike page says it went back from 175% to 200% in V26.01. Infinity Edge's +30% is a plain item stat (`critDamage`, now read by the code).
- **Yone's passive is a stat rule** in `championStats`, run before item passives: item crit × 2 (max 100%), 0.5 bonus AD per 1% over 100%, crits at 95%. It's in the data file as `critPassive`, so another champion with a crit passive is data-only.
- **Yone's E shows "deals no damage by itself" (Eric).** Soul Unbound repeats 25-35% of the damage dealt during it, so its damage depends on a whole combo. A combo page could come later.
- **Yone's skill order: R whenever possible, then max Q, then W, then E (Eric).** Levels 1-3 take Q, W, E.
- **Yone's R applies no on-hit effects (Eric).**
- **Yone's data (patch 26.23; his numbers last changed in V26.21):**
  - HP growth is 105 per level (the wiki's champion data module). His page's "Special statistics" box shows 115: that's Arena (+10).
  - R has 3 ranks, 200 / 400 / 600 total (the damage table and tooltip). The same page's parameter list shows 5 values (200 / 300 / 400 / 500 / 600), a leftover; every ultimate has 3 ranks.
  - W: physical lands first; R: magic lands first (wiki notes). The order matters for Black Cleaver and Shadowflame.
- **Basic damage vs. ability damage (new with Yone).** Yone's Q is basic damage on its first target. Each piece of damage now says whether it's ability damage (`abilityDamage`), and items whose wiki text says "ability damage" check that instead of "not from an item": Liandry's, Blackfire, Luden's, Spear of Shojin, Bastionbreaker, Voltaic (Galvanize). For Katarina and Akali every hit is ability damage, so nothing changed for them.
- **Yone and the items (every crit or basic-attack item re-read for him):**
  - Infinity Edge: no passive, but its +30% crit damage stat now counts (Yone's Q crits).
  - Essence Reaver reads Yone's doubled crit chance (capped at 100%).
  - Hexoptics C44 raises basic damage by distance (1% per 50 units). Yone stands right next to the dummy, so 0%.
  - Sundered Sky, Fiendhunter Bolts, Navori, Yun Tal's crit stacks: they need basic attacks. Q isn't a basic attack (it's basic *damage*).
  - Unending Despair: his window is 3 s, before its first sap at 4 s.
  - Items "on your ultimate" (Malignance, Zeke's, Hexplate) work for his R.
- **Minimum stats (Eric, Nov 2026).** A fold-out "Minimum stats" box under the item slots: HP, armor, MR, AD, AP, attack speed, crit chance, ability haste, move speed. Only builds that reach every number typed in are shown.
  - Chose TOTAL stats, as the in-game stat panel shows them (Eric), over "from items only": that's the number players know. `src/stats/stat-panel.ts` works them out from `championStats`, so passives that change a stat count (Rabadon's, Riftmaker, Yone's crit × 2). Armor, MR and ability haste aren't used by the simulation, so they're base stats + plain item stats. Attack speed stops at the 2.5 cap.
  - The best-per-stat cards follow the minimums too (Eric).
  - The quick search (1 free item) ignores minimums, because one item rarely reaches them; it would show "no build" before you even click Optimize. With 1 slot the quick search is the whole build, so then it follows them.
  - Every-build search: builds that miss a minimum are skipped before they're simulated (cheaper too).
  - Beam search, two changes:
    - A partial build is dropped when even a best case can't reach a minimum (fill the free slots with the items that raise that stat the most, ignoring item groups). The best case is a guess (items that boost each other can beat it).
    - Besides its 300 most damaging partial builds, the beam keeps the 300 closest to the minimums (see the bug below). Full with 300 AP + 300 AD: ~4.2 s instead of ~3.4 s with no minimums.
    - Slow tests, 4 minimum setups: Late's beam = every build, and Full's beam of 300 = a beam of 5,000.
  - A stat with a minimum keeps its items in the search even if the speed filter would remove them (Frozen Heart for armor).
- **Maximize (Eric, Nov 2026).** A Max button next to each stat box; several can be on at once.
  - With Max on, builds are ranked by those stats instead of damage, and damage breaks ties.
  - Several stats: chose "balanced" (Eric) over "add the shares up" (one huge stat could make up for a weak one) and "first one clicked wins" (the second stat would almost never matter). Each stat counts as a share of its PEAK, the most any build reaches with the same locks, bans and minimums. A build's score is its weakest share.
  - The peaks come from the same search run on one stat with no damage simulation (`peakOf` in search.ts), so they cost little: Full with Max AP + AD took ~4.6 s vs ~3.4 s without.
  - The score is rounded to 9 decimals so builds that are really equal (100% crit) tie and damage decides.
  - `FoundBuild.score`: ranking uses it when present, otherwise damage (top-builds.ts). Without Max nothing changes.
  - Slow tests, 3 Max setups: Late's beam = every build, Full's beam of 300 = a beam of 5,000.
- **Stat tiles look (Eric: the boxes looked "blocky, rigid, static").** Each stat is a small tile tinted in its own colour (`--stat-*` in style.css, a darker set for the light theme), with a hand-drawn icon (`src/ui/stat-icons.ts`).
  - Chose our own SVG icons over Riot's stat icons: nothing new to download or keep up to date, and they take the tile's colour.
  - Hover lifts the tile and tilts the icon. A tile with a minimum or Max on glows, and switching Max on pops the icon. Everything stays still for people whose system asks for reduced motion.
  - Short names on the tiles (MR, AS, Crit, Haste, MS) because the long ones were cut off; the full name is the tooltip.
- **Garen (Eric, Nov 24, 2026): Q, E and R; W "deals no damage".** Melee, so none of the ranged-champion work (`PLAN-ranged-champions.md`) was needed first.
  - **Q is an empowered basic attack:** the attack (100% AD, basic damage, on-hit and on-attack at full strength, can crit) + the bonus (30-150 + 50% AD, ability damage, never crits). The page shows "no crit / crit" like Yone's Q.
  - **Q's crit bug is left out:** the wiki says a crit makes the bonus "~6.5%" bigger (a bug). "~" isn't an exact number to code.
  - **E's crits are averaged (Eric).** Chose the average over "no crit / every spin crits" (Yone's rule): with 7+ spins, every spin critting is very unlikely below 100% crit. A crit spin deals 130% (139% with Infinity Edge): 1 + 0.3 x (crit damage - 1). The template's raw IE numbers (x1.6) are out of date; its preview shows x1.39.
  - **E's spin count:** 7 + 1 per full 25% bonus attack speed (items + levels; level 18 alone gives 2 extra). Every spin gets the +25% "nearest enemy" bonus (one dummy = always the nearest).
  - **E's item window is 3 s after the LAST spin** (up to 6 s), the one-hit rule. So Unending Despair's first sap (4 s) counts for E.
  - **The dummy's "Health %" box (Eric: starts at 100%), for EVERY ability of every champion.** It sets the dummy's health when the cast starts, and every item effect sees that health too. First made for Garen's R only (its bonus is 25 / 30 / 35% of the dummy's MISSING health, so at full health R is just its base damage). Eric then chose every ability: "they still may utilize items such as Shadowflame, or have missing health damage" (Akali's R2, Kraken Slayer, Blade of the Ruined King). At 100% nothing changes: a full dummy, as before. Veigar's R will use it too (`PLAN-ranged-champions.md`).
  - **R has no AD or AP ratio,** so builds only change its damage through item effects (Sunfire, Liandry's...). Expect odd-looking top 5s; that's the real answer.
  - **Skill order: R whenever possible, then max E, then Q, then W.** Levels 1-3 take Q, E, W.
  - **Garen's data (patch 26.23; his page last changed in V26.14):** R's base was lowered to 125 / 200 / 275 in V26.14. The R template's parameter list has 5 values; we use the 3 the tooltip shows, as for Yone.
- **Home page show (Eric, Nov 24, 2026: the plain page looked "static, stagnant, rigid, lame"; he asked for "anything that's extravagant and grand").** `src/ui/pages/home-page.ts` + "Home page" in style.css. Three layers behind the search:
  - EVERY champion's splash art, in a random order (Eric), fills the window, slowly zooming and drifting (Ken Burns), cross-fading every 7 s. Each champion is shown once before any repeats (a shuffled list, reshuffled when it runs out). A "Featuring ..." line under the search changes with it and links to that champion's page (a playable one to its calculated ability: "Katarina: Death Lotus"). The list comes from `championList`, so new champions join by themselves.
  - Only two picture layers take turns: while one is on screen, the other loads the next picture and only fades in once it has loaded. Chose this over one layer per champion: ~170 layers would download every picture at once.
  - Bug / cause / fix (Eric: "right at the end of the zooming, it jolts back to a default position"): the zoom animation was only on the "active" picture, so it was switched off the moment the picture started fading out, and the half-visible picture snapped back to its starting size. Fix: the outgoing picture gets "leaving", which keeps the SAME animation (same name, so the browser carries on instead of restarting); "leaving" is removed only once it's fully faded out. The zoom lasts 10 s (longer than 7 s + the 1.8 s fade) and holds its last frame. Light mode's colour boost was moved to every layer for the same reason.
  - Damage numbers float up and fade like in game (magic purple, physical orange, true green, a big red crit about 15% of the time), kept out of the middle column. They're decoration only, not real results.
  - The title gets a sweeping shine and a red glow; the page's parts rise in one after another. The top bar is see-through, as on champion pages.
  - Chose these over a wall of all ~170 champion icons (busier, and 170 images to load). Only images the site already has; no new dependency.
  - People whose system asks for reduced motion get one still picture: no slideshow, numbers, zoom or shine. Timers pause in a background tab and stop when you leave the page (`mountHomePage` returns a clean-up function now).
  - Checked in headless Chrome: random champions (Hwei, Qiyana, Annie...), the outgoing picture is "leaving" during the fade, the Featuring link follows, numbers appear and remove themselves. Headless screenshots don't show the floating numbers mid-animation, so check them in a real browser.
- **Ranged champions (Nov 25, 2026): Lux, Caitlyn, Veigar, Ezreal.** Eric's decisions from `PLAN-ranged-champions.md` (Veigar's stacks box with presets 50 / 125 / 200 / 300, Ezreal's W detonated by a 0-damage attack with no on-hit, Caitlyn's W "deals no damage", ranged champions at their attack range), plus:
  - **Chose abilities as data over one code file per champion,** so most champions are a data file only. Chose NOT to move Katarina, Akali, Yone and Garen onto it: their code works and is tested, and rewriting it would only risk changing numbers. New modifiers get added to `ability-spec.ts` (with a test) when a new champion needs one.
  - **Chose a draft-writing script over reading the wiki while the site runs:** the site stays static, every number is still checked by a person, and the draft keeps the wiki's raw text next to each number.
  - **Distances:** the dummy stands exactly at the champion's attack range, edge to edge (how attack range works). Both champions have a 65-unit radius (wiki, Range: "an edge range of 550 units is equivalent to a centered range of 680 units"). Each aura is measured the way its wiki text says. Sunfire / Hollow Radiance (325) and Unending Despair (650, centred) never reach a ranged champion's dummy. Abyssal Mask (700, centre to edge) reaches it from 550 (615), not from Caitlyn's 650 (715).
  - **Travel time is ignored** (missiles land when cast), like Katarina's daggers. Veigar's W keeps its 1.2 s delay ("from the start of the cast time").
  - **Lux's E** counts only the recast (detonation), cast right away. **Caitlyn's R** lands at 0 s (combat starts when the bullet fires, like a one-hit ability); its crit-chance bonus is its own line in the breakdown. **Veigar's R** uses the dummy's "Health %" box: +1.5% per 1% missing, up to +100% at 2/3 missing.
  - **Ezreal's Q is basic AND ability damage** (wiki: "deals basic damage, but also triggers spell effects"): `damageKind: "both"`. It applies on-hit and on-attack and uses its own cast's Spellblade (wiki, Spellblade: abilities that apply on-hit effects can trigger it), like Katarina's E. Black Cleaver treats it as ability damage (its stack goes on before the hit).
  - **Ranged item numbers** come from the wiki's item data (melee / ranged pairs): BotRK 6%, Eclipse 5%, Hexplate 25% AS + 10% MS, Titanic 0.5%, Hullbreaker 70%, Kraken 80% (and on-attack instead of on-hit), Voltaic 6% + 12 lethality, Bastionbreaker 20 + 0.75 per lethality. Other items with ranged numbers only change things the site doesn't count (move speed, healing, slows, omnivamp).
  - **Skill orders:** Lux R > E > Q > W (mid Lux maxes E), Caitlyn R > Q > E > W, Veigar R > Q > W > E, Ezreal R > Q > E > W.
  - **Champion stats** came from the wiki's champion data module (the same numbers as the plan's table, read the day before).
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

## Adding a champion
1. `node scripts/new-champion.mjs <Name>` writes a draft `src/data/<slug>.ts` from the wiki.
2. Finish the draft. For each ability, read the wiki text kept above it:
   - Remove abilities that deal no damage, and write why in `noDamageAbilities` (step 3).
   - Set the hit times, and the flags: on-hit, on-attack, Spellblade, `damageKind` (basic / ability / both).
   - Anything that grows with the dummy's missing health or with crit chance is a `modifier`. Anything else new needs a new modifier kind in `src/simulation/ability-spec.ts`, with a test. A kit that really can't be data (Katarina's daggers) gets its own `<slug>-abilities.ts` like hers.
   - Set the skill order. Check the stats against the wiki's infobox.
3. In `src/data/playable-champions.ts`: add the champion to `playableChampions`, `modelledAbilities` and `noDamageAbilities`. In `src/simulation/abilities.ts`: add `<slug>: fromSpecs("<slug>")` (the type check reminds you).
4. Add the ability pages to `abilityPages` in `scripts/check-wiki.mjs`.
5. Tests: copy one champion's block from `tests/ranged-champions.test.ts` (each ability worked out by hand at level 18). The search, sources and page tests pick the champion up by themselves.
6. If the champion's passive changes their stats (Yone's crits, Veigar's stacks), it goes in the data file (`critPassive`, `stackPassive`) and `championStats`.
7. Update CLAUDE.md's scope, NOTES.md (decisions), and the skill-order line on the about page (`src/ui/info-view.ts`).

## Bugs (bug / cause / fix)
- **Minimum stats: the beam missed builds (caught by the new slow test).**
  - Bug: Katarina R, Late, 200 AP + 200 AD: the beam found 3 builds, trying every build found 5. At Full with 300 AP + 300 AD it found 1.
  - Cause: the beam kept its 300 most damaging partial builds. With minimums, most of those (mostly AD, say) pass the best-case check but can never reach both minimums, so the partial builds that could were pushed out.
  - Fix: with minimums the beam keeps a second group of 300, the partial builds closest to the minimums. First tried an exact check with 1 slot left instead: it fixed Late but made Full 4× slower (~1 million stat calculations) and still missed builds there.
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
- **Home page: "Featuring" and "Patch" lines drawn over the search results (Nov 25, 2026).**
  - Bug: typing in the home search, the list of champions had the Featuring and Patch lines on top of it.
  - Cause: every line under the title rises in with a CSS animation that uses `transform`. An element with a transform becomes its own layer (a "stacking context"), and layers later in the page are drawn on top, so the lines after the search covered its list, whatever its `z-index`.
  - Fix: `#home-search` gets `position: relative; z-index: 5`, which puts its whole layer above its siblings.

## Item checklist
Every legendary and boots item in the snapshot, checked in Step 5c against the wiki (patch 26.23).
A test (`tests/item-checklist.test.ts`) fails if an item is missing from these tables or has an unknown status.

**What this checks:** only an item's *passive*. Every item's plain stats (AP, AD, HP, pen…) are already counted by `src/stats/`.
The question for each item is: does its passive change Death Lotus damage on one dummy during one channel, under our rules (see "Rules for item passives" in Decisions)?
(Checked for R. With Q and E added, every "modelled" item was re-read for one-hit abilities; see "Q / E details" in Decisions. With Akali added, every item was re-read for her: no on-hit at all, E's two casts at once, and R's longer window (5.5 s); see "Akali and the items" in Decisions. The "irrelevant" items stay irrelevant: each needs basic attacks or on-hit, takedowns, slows, allies, mana or other enemies. Unending Despair became "modelled" for Akali's R. With Yone added, every crit or basic-attack item was re-read: see "Yone and the items" in Decisions. With Garen added, every item that needs a basic attack or a longer window was re-read: his Q is a real basic attack (Sundered Sky became "to model", then "modelled"), and his E's window reaches 6 s (Unending Despair now counts; Heartsteel still needs a basic attack after 3 s of charging, which neither Q nor E gives).)

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
| Abyssal Mask | modelled | "Unmake": the dummy takes 12% more magic damage (after MR) from every source, within 700 units (centre to edge). Melee: always. Ranged: from 550 yes, from Caitlyn's 650 no. `src/items/abyssal-mask.ts`. |
| Actualizer | checked, irrelevant | Active only. |
| Archangel's Staff | checked, irrelevant | AP from mana, but Katarina has no mana (wiki: resource "None"). Its AP stat counts. |
| Ardent Censer | checked, irrelevant | Needs healing allies. |
| Axiom Arc | checked, irrelevant | Needs takedowns. |
| Bandlepipes | checked, irrelevant | Needs slows / immobilizes, gives move speed. |
| Banshee's Veil | checked, irrelevant | Defensive. |
| Bastionbreaker | modelled | "Shaped Charge": dagger 1 deals 40 + 1.5 per lethality bonus true damage (melee). "Sabotage" needs a takedown: irrelevant. `src/items/bastionbreaker.ts`. Not triggered by Yone's Q (basic damage). |
| Black Cleaver | modelled | "Carve": physical damage gives a stack (−6% armor each, up to −30%), one per dagger. R's own hit benefits from its own stack (wiki); Yone's Q (basic damage) only helps later hits. `src/items/black-cleaver.ts`. |
| Blackfire Torch | modelled | "Baleful Blaze": R's damage starts a burn, 10 + 1% AP every 0.5 s, refreshed by every dagger (5 ticks inside the ult), shrunk by R's % (Death Lotus bug). "Blackfire": +4% AP while it burns (from dagger 2), added to Rabadon's 30%. `src/items/blackfire-torch.ts`. Not triggered by Yone's Q (basic damage). |
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
| Eclipse | modelled | "Ever Rising Moon": 2 stacks within 2 s (one per cast instance) deal 8% of the dummy's max HP as physical damage, once (6 s cooldown). Katarina's R: each dagger counts as a separate hit (Death Lotus page), so dagger 2 procs it. Akali's E: first cast + recast are 2 casts, so the recast procs it. Akali's R: R1 and R2 are 2.5 s apart, so never. Garen's E: one cast instance, so one stack and never. Not shrunk by R's %. `src/items/eclipse.ts`. (Was "checked, irrelevant" until Step 5d-5c.) |
| Edge of Night | checked, irrelevant | Defensive. |
| Endless Hunger | checked, irrelevant | Needs takedowns. |
| Essence Reaver | modelled | Spellblade, first dagger only: 125% base AD + 0.5 per 1% crit chance, physical. Yone's crit chance is doubled by his passive. `src/items/essence-reaver.ts`. |
| Experimental Hexplate | modelled | "Overdrive": casting R gives +50% bonus attack speed (raises R's AD part) and +20% move speed (Swiftmarch counts it) for the whole ult. A stat passive. `src/items/experimental-hexplate.ts`. |
| Fiendhunter Bolts | checked, irrelevant | Empowers basic attacks after R. |
| Force of Nature | checked, irrelevant | Defensive. |
| Frozen Heart | checked, irrelevant | Defensive. |
| Guardian Angel | checked, irrelevant | Defensive. |
| Guinsoo's Rageblade | modelled | "Wrath": 30 magic on-hit. "Seething Strike": daggers 1-4 give +8% attack speed each (from the next dagger); Phantom Hits (every on-hit effect again, 0.15 s later, at R's %) after daggers 7, 10, 13. `src/items/guinsoos-rageblade.ts`. |
| Heartsteel | checked, irrelevant | "Colossal Consumption": 1 stack per second near the dummy, procs at 3. Stacks start at 0 when R is cast (Eric, Step 5d-6), so the 3rd comes at 3 s, after the ult. Permanent HP stacks also start at 0. Akali: the proc is an empowered basic attack, and her abilities apply no on-hit. |
| Hexoptics C44 | modelled | +1% basic damage per 50 units (edge to edge), up to 10%. Melee: 0%. Ranged (550+): 10%, only on basic damage (Ezreal's Q). `src/items/hexoptics-c44.ts`. |
| Hextech Gunblade | checked, irrelevant | Active only. |
| Hextech Rocketbelt | checked, irrelevant | Active only. |
| Hollow Radiance | modelled | "Immolate": 15 + 1% bonus HP magic damage every second (2 ticks inside the ult). "Desolate" needs a kill: irrelevant. `src/items/hollow-radiance.ts`. |
| Horizon Focus | modelled | "Hypershot": ability damage from 600+ units (centred) marks the dummy: +10% damage, the triggering hit included. Melee: never (130 units). Ranged: always. `src/items/horizon-focus.ts`. |
| Hubris | checked, irrelevant | Needs takedowns (starts at 0 stacks). |
| Hullbreaker | modelled | "Skipper": every 5th on-hit (daggers 5, 10, 15) deals 120% base AD + 5% of Katarina's max HP physical, × R's %. `src/items/hullbreaker.ts`. |
| Iceborn Gauntlet | modelled | Spellblade, first dagger only: 150% base AD physical. `src/items/iceborn-gauntlet.ts`. |
| Immortal Shieldbow | checked, irrelevant | Defensive. |
| Imperial Mandate | checked, irrelevant | Needs an immobilize; R has none. |
| Infinity Edge | checked, irrelevant | No passive. Its +30% crit damage stat counts for Yone's Q (the only ability that can crit). |
| Jak'Sho, The Protean | checked, irrelevant | Defensive. |
| Kaenic Rookern | checked, irrelevant | Defensive. |
| Knight's Vow | checked, irrelevant | Needs an ally. |
| Kraken Slayer | modelled | "Bring It Down": every 3rd on-hit (daggers 3, 6, 9, 12, 15; Phantom Hits add stacks) deals 150-200 physical by level, up to +75% by missing health, × R's %. `src/items/kraken-slayer.ts`. |
| Liandry's Torment | modelled | "Torment": burn, 1% of the dummy's max HP every 0.5 s, refreshed by every dagger (5 ticks inside the ult), shrunk by R's % (Death Lotus bug). "Suffering": +2% damage per second in combat, up to 6%, starting at 0 when R is cast. `src/items/liandrys-torment.ts`. Not triggered by Yone's Q (basic damage). |
| Lich Bane | modelled | Spellblade, first dagger only (Eric, from playing): 75% base AD + 45% AP magic. `src/items/lich-bane.ts`. |
| Locket of the Iron Solari | checked, irrelevant | Active only. |
| Lord Dominik's Regards | modelled | "Giant Slayer": 1% more damage per 100 of the dummy's BONUS HP (from items), up to 15%. `src/items/lord-dominiks-regards.ts`. |
| Luden's Echo | modelled | "Echo": 6 stacks, full at R cast, used by dagger 1: 75 + 5% AP, then 5 × (15 + 1% AP) every 0.25 s (one enemy, so every leftover stack hits it). All shrunk by R's % (Death Lotus bug). `src/items/ludens-echo.ts`. Not triggered by Yone's Q (basic damage). |
| Malignance | modelled | "Hatefog": the first ult hit makes a 3 s zone: (60 + 5% AP) / 4 magic damage every 0.25 s (10 ticks inside Katarina's channel, all 12 for Akali's R) and −10 MR from the next hit until the zone ends. "Scorn" (ultimate haste) is irrelevant. `src/items/malignance.ts`. |
| Manamune | checked, irrelevant | AD from mana, but Katarina has no mana. Its AD stat counts. |
| Maw of Malmortius | checked, irrelevant | Defensive. |
| Mejai's Soulstealer | checked, irrelevant | Stacks come from kills, so 0 stacks. Its plain AP stat counts. |
| Mercurial Scimitar | checked, irrelevant | Active only. |
| Mikael's Blessing | checked, irrelevant | Active only. |
| Moonstone Renewer | checked, irrelevant | Needs healing allies. |
| Morellonomicon | checked, irrelevant | Grievous Wounds; the dummy doesn't heal. |
| Mortal Reminder | checked, irrelevant | Grievous Wounds. Its armor pen stat counts. |
| Nashor's Tooth | modelled | On-hit 15 + 15% AP magic damage. `src/items/nashors-tooth.ts`. |
| Navori Flickerblade | checked, irrelevant | Lowers cooldowns of basic abilities. Its crit chance stat counts for Yone. |
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
| Runaan's Hurricane | checked, irrelevant | Ranged champions only (`meleeCannotBuy`). Its bolts hit other enemies: on one dummy only its stats count. |
| Rylai's Crystal Scepter | checked, irrelevant | Slow. |
| Serpent's Fang | checked, irrelevant | Reduces shields; the dummy has none. |
| Serylda's Grudge | checked, irrelevant | Slow. Its pen stat counts. |
| Shadowflame | modelled | "Cinderbloom": magic and true damage × 1.2 when the dummy is already below 40% of its max HP. `src/items/shadowflame.ts`. |
| Shurelya's Battlesong | checked, irrelevant | Active only. |
| Spear of Shojin | modelled | "Focused Will": R's damage gives a stack (max 1 per second per cast), +3% R damage each, counting from the next hit. During R: +3% on daggers 2-8, +6% on 9-15. `src/items/spear-of-shojin.ts`. Check: see "Unconfirmed". Not triggered by Yone's Q (basic damage). |
| Spirit Visage | checked, irrelevant | Defensive. |
| Staff of Flowing Water | checked, irrelevant | Needs healing allies. |
| Statikk Shiv | modelled | Energized (dagger 1 only): chain lightning 60 magic, NOT shrunk by R's % (wiki: "not affected by on-hit damage modifiers"). One dummy, so one bounce. `src/items/statikk-shiv.ts`. |
| Sterak's Gage | modelled | "The Claws that Catch": bonus AD = 50% of base AD, which counts for R. `src/items/steraks-gage.ts`. |
| Stormrazor | modelled | Energized (dagger 1 only): 100 magic on-hit, × R's %. `src/items/stormrazor.ts`. |
| Stormsurge | modelled | Deal 25% of the dummy's max HP within a rolling 2.5 s → lightning strike 2 s later, 125 + 10% AP magic. Inside Katarina's ult only if triggered by 0.5 s; Akali's R1 + R2 (2.5 s apart) count together. `src/items/stormsurge.ts`. |
| Stridebreaker | checked, irrelevant | Cleave hits only other enemies; active doesn't count. |
| Sundered Sky | modelled | "Lightshield Strike": the next *basic attack* against a champion crits for 80% of total crit damage (160%, 184% with Infinity Edge; the wiki's "60% + IE 24% bonus damage" is the same number). Only Garen's Q is a basic attack (Yone's Q is basic damage, not an attack). It replaces the normal crit, so Q always crits and shows one number. The heal is ignored. `src/items/sundered-sky.ts`, `tests/items/sundered-sky.test.ts`. Check in the Practice Tool. |
| Sunfire Aegis | modelled | "Immolate": 20 + 1.5% bonus HP magic damage every second (2 ticks inside the ult). `src/items/sunfire-aegis.ts`. |
| Terminus | modelled | "Shadow": on-hit 30 + 10% bonus AD + 10% AP magic. "Juxtaposition": Dark hits (2nd, 4th, 6th on-hit) give +10% armor and magic pen each, up to 30%. `src/items/terminus.ts`. Check: see "Unconfirmed". |
| The Collector | checked, irrelevant | Execute below 5% HP; under our overkill rule the dummy never dies. Its lethality stat counts. |
| Thornmail | checked, irrelevant | Reflects damage Katarina takes. Its HP stat counts (Riftmaker). |
| Titanic Hydra | modelled | "Cleave": on-hit 1% (melee) of Katarina's max HP, physical. `src/items/titanic-hydra.ts`. |
| Trinity Force | modelled | Spellblade, first dagger only: 200% base AD physical. `src/items/trinity-force.ts`. |
| Umbral Glaive | checked, irrelevant | Needs Katarina unseen; Death Lotus reveals her. |
| Unending Despair | modelled | "Anguish": every 4 s after combat starts, 3% bonus HP as magic damage. Only Akali's R (R2 at 2.5 s + 3 s of item effects) and Garen's E (last spin at 3 s + 3 s) reach 4 s; Katarina's 2.5 s ult and every one-hit ability end first. `src/items/unending-despair.ts`. (Was "checked, irrelevant" until Akali.) |
| Void Staff | checked, irrelevant | No passive. Its 40% magic pen stat counts. |
| Voltaic Cyclosword | modelled | "Galvanize": R's first damage triggers the Energized effect (before that damage, not shrunk): 8% of the dummy's current HP physical + 15 lethality for the whole ult. Yone's Q (basic damage) procs it through its on-hit instead. `src/items/voltaic-cyclosword.ts`. |
| Warmog's Armor | modelled | "Warmog's Vitality": +12% of items' plain HP stats (not HP from item passives). Matters with Riftmaker / Overlord's. `src/items/warmogs-armor.ts`. |
| Winter's Approach | checked, irrelevant | HP from mana, but Katarina has no mana. |
| Wit's End | modelled | On-hit 45 magic damage. `src/items/wits-end.ts`. |
| Youmuu's Ghostblade | checked, irrelevant | Move speed; active doesn't count. |
| Yun Tal Wildarrows | modelled | "Flurry": dagger 1 gives +30% attack speed for daggers 2-15. Crit stacks start at 0 and crit doesn't affect R. `src/items/yun-tal-wildarrows.ts`. |
| Zeke's Convergence | modelled | "Frostfire Tempest": casting R starts a storm: 7.5 magic damage every 0.25 s (10 ticks inside the ult). `src/items/zekes-convergence.ts`. |
| Zhonya's Hourglass | checked, irrelevant | Active only. |
