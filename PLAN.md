# Version 1 plan: Katarina R (Death Lotus) build optimizer

## Context
The GitHub repo already exists and is public. This local folder holds only `CLAUDE.md` and isn't linked to git yet.

Goal for v1: a static site at lol.ericzhong.ca that, for a chosen game stage and target dummy, tries every legal build and shows the top 5 builds by Death Lotus damage, each with a damage breakdown.

Eric is learning, so we go one small step at a time. Each step starts with a plain-language explanation, waits for his OK, and ends with notes in NOTES.md.

## Decisions made in this planning session (to record in NOTES.md and CLAUDE.md)
- **Item pool:** only completed legendary items, following the game's rules: no duplicates, and items with the same unique passive can't be combined.
- **Boots toggle:** when on, the optimizer picks the best tier-2 boots in their own slot. A build never has more than 6 slots in total:
  - Boots on: Early 1 item + boots, Mid 2 + boots, Late 3 + boots, Full **5** + boots.
  - Boots off: 1 / 2 / 3 / 6 items.
  - The extra boots slot that bot-lane players earn from their role quest is ignored.
- **Mid quest toggle:** works only when boots are on.
  - When it's on, the optimizer picks from the upgraded tier-3 boots.
  - In Step 5, I'll check on the wiki exactly what the quest gives on the current patch. That data gets a source like every other number.
- **Results:** the top **5** builds, ordered by damage. CLAUDE.md says top 10, so I'll update it.
- **Dummy:** the user picks a stage (which sets the level) and an enemy type. Every value stays editable afterwards.
  - The enemy types are based on real champions, and the site names them: squishy = **Nami**, bruiser = **Illaoi**, tank = **Sion**.
  - Only the champion's stats are used. Their abilities (shields, passives) are ignored.
  - **Decided later (during Step 1):** the dummy also gets items. A dummy = champion + level + items, and its HP / armor / MR = champion stats at that level + the items' plain stats (no item passives).
    - A "Use recommended items" checkbox (on by default) uses a recommended item list per champion and stage. Unchecked, the user picks the items from the legendary list.
    - Adding champions must be data-only. Any champion as the dummy is planned for version 2.
- **Overkill rule:** the dummy never dies.
  - Once a hit would kill it, it stays at 1 HP and every remaining hit still counts at full damage.
  - Effects that depend on the target's HP then see 1 HP.
  - This rule is shown on the site.
- **Item filter (built in from the start):** an item is removed from the search only if no code anywhere reads any of its stats.
  - Because Riftmaker turns HP into AP, every item that gives HP stays in, Thornmail included.
  - Removed items are listed on the site.
- **Breakdown credit for items:**
  - What an item contributes = (damage with the item) − (damage without it). This is its "marginal damage".
  - Multiplying items like Rabadon's are handled correctly by this.
  - Because items boost each other, the marginal numbers don't add up exactly to the total. The site says so, and shows the leftover as an "item interactions" line, so the displayed total still adds up.
- **Damage type breakdown:** each build also shows:
  - how much of its damage was **magic, physical and true**
  - how much came from the **ability** (R daggers: base + ratios) and how much from **item effects** (on-hit and passives)
  - both views as numbers and percentages of the total.

## Steps (each one is a separate, reviewed change)

**Step 0: Project setup**
- Install Node.js.
- Clone the existing repo with GitHub Desktop, then move `CLAUDE.md` into it, or link this folder to it.
- Scaffold Vite + plain TypeScript.
- Add **Vitest** (a test runner) as the only extra dependency, once you confirm it.
- Add `.gitignore` and a starter `NOTES.md` that covers how to run the site, how to run the tests, and the project layout.

**Step 1: Katarina data, with sources**
- `src/data/katarina.ts` holds:
  - Katarina's base stats and how they grow per level.
  - R damage by rank: number of daggers, channel time, and the AD and AP ratios.
  - On-hit effectiveness of 25 / 30 / 35% by R rank.
- Every number gets a wiki link and the patch it comes from.
- `src/data/patch.ts` holds the one patch version that the whole site shows.

**Step 2: Dummy presets**
- `src/data/dummies.ts` holds the base stats and per-level growth for Nami, Illaoi and Sion, with wiki sources.
- The dummy's stats at each stage's level come from the same stat-at-level formula that Katarina uses.
- A recommended item list for each champion and stage (item names only, chosen by Eric). Their stats get added in Step 5, once the item snapshot exists.

**Step 3: Core formulas, with unit tests** (a unit test checks one formula against an answer we already know)
- Stats at a given level.
- Raw R damage per dagger and for the whole ult.
- How armor and MR reduce damage, including penetration in the game's order. I'll check that order on the wiki before coding it.

**Step 4: Dagger-by-dagger simulation**
- The simulation goes through the channel one dagger at a time. This handles HP-dependent effects, time-based effects, and the 1-HP overkill rule.
- Only damage that lands inside the channel window is counted.
- Each damage event records its source (base, AP ratio, AD ratio, on-hit, or a specific item passive) and its type (magic, physical or true). Every breakdown on the site is built from these records, so all the views come from the same numbers and always agree.

**Step 5: Items**
- **Base stats come from data, not by hand:**
  - A small Node script (`scripts/update-items.mjs`, no new dependency) downloads Data Dragon's `item.json`. (Changed from Meraki in Step 5a: Meraki's item stats were out of date.)
  - It saves a snapshot in `src/data/items.<patch>.json` with the source URL and patch.
  - The site reads that saved snapshot. It never fetches anything while running, so results can't change unless we update the snapshot.
- **Passives are hand-coded,** one per file in `src/items/<item>.ts`, each with its own test.
- **Stat conversions** (Riftmaker turning HP into AP, mana into AP, and so on) run in a "final stats" step after all item stats are added up. They're tested with item pairs such as Warmog's + Riftmaker.
- **Dummy items:** the dummy's HP / armor / MR adds the plain stats of its items. A test checks that every recommended item name exists in the snapshot.
- **Checklist in NOTES.md:** every legendary item and boots option, each marked "modelled", "checked, irrelevant" or "not checked yet".

**Step 6: Optimizer**
- It keeps the top 5 builds by damage, including boots and tier-3 boots when those toggles are on.
- **Changed in Step 6 (Eric approved):** the filter only removes 1 item (Frozen Heart), because almost every item gives HP and Riftmaker turns HP into AP. Full is ~680 million builds with boots (~4.5 hours), and Late ~1.3 million (~30 s).
  - Early and Mid try every legal combination.
  - Late and Full use a beam search: build one item at a time and keep the best 300 partial builds at each size.
  - Slow test: Late's beam top 5 must equal the every-combination top 5, for each enemy type.
  - Test: Full's top 5 must be the same with a beam of 300 and 1,000.
- The filter from the decisions above runs first.
  - Early, Mid and Late: the filtered search should give the same top 5 as an unfiltered one.
- The search runs in a **Web Worker**, which is a background thread in the browser, so the page doesn't freeze.
- Tests:
  - Legality rules and ranking.
  - **Filter test:** Early, Mid and Late, each run filtered and unfiltered, must give an identical top 5. If the Late version is slow, it gets marked as a slow test that you run before each release.

**Step 7: User interface (plain HTML/TS)**
- Controls: stage, enemy type, "Use recommended items" checkbox with a dummy item picker when it's off, editable HP/armor/MR, boots toggle, mid quest toggle.
- Results: the top 5 builds, each with:
  - the source breakdown (base, AP ratio, AD ratio, on-hit, item passives)
  - each item's marginal damage
  - magic / physical / true split
  - ability vs. items split
- Rules shown on the site:
  - the channel window
  - the overkill rule
  - how items are credited
  - which items were filtered out
- A section listing the sources and the patch.

**Step 8: Practice Tool validation (you test in game, I prepare everything)**
- I'll write `validation/practice-tool-plan.md` for you to fill in.
- **Setup:** patch, Katarina's level, R rank, and the dummy's HP/armor/MR.
  - I'll check whether the Practice Tool lets you edit the dummy's armor and MR.
  - Set the dummy's HP high enough that the 1-HP rule never kicks in during a test.
- **Neutral rune page:** the game won't let you play without runes, so we pick runes that can't add damage to R.
  - That means no damage keystone, no adaptive force shards, and no First Strike, Sudden Impact or Gathering Storm.
  - A likely page is Resolve (Guardian) with an Inspiration secondary, plus haste, move speed and health shards. I'll verify it on the current patch.
- **Builds to test:**
  1. No items: base damage plus the AD/AP ratios.
  2. Pure AP: one item, then two.
  3. Pure AD: one item.
  4. On-hit, such as Nashor's, at different R ranks to check the 25 / 30 / 35%.
  5. One test per coded passive, such as Liandry's burn or Riftmaker + Warmog's.
  6. The open questions from NOTES.md ("Unconfirmed: to check in the Practice Tool"): when the first dagger lands, whether daggers give Guinsoo's stacks, and how "X% more damage" effects combine.
- **For each build, I give you** the expected total and each item's expected marginal damage.
- **For each build, you record** the total from one ult. Where you can, also test the same build without one item, so each item's contribution can be checked on its own.
- **Results:**
  - They go into `tests/practice-tool.test.ts` with the patch, and that test checks the calculator within a small tolerance.
  - Any mismatch gets logged in NOTES.md as bug / cause / fix.

**Step 9: Deploy**
- Connect the repo to Vercel.
- Add `lol.ericzhong.ca` as a custom domain, plus a CNAME record wherever your domain's DNS is managed.
- Check that pushing to `main` redeploys the site automatically.

## Verification
- `npm test` passes: formulas, items, conversions, the optimizer, the filter-equivalence test and the Practice Tool test.
- `npm run dev`: for every stage, enemy type and toggle combination, the site shows 5 builds and each breakdown adds up to its total.
- The deployed lol.ericzhong.ca shows the same results as the local version.
