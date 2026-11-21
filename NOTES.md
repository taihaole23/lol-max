# Project notes

These notes are for anyone joining the project.
- `CLAUDE.md` says what the project is and lists its rules.
- `PLAN.md` is the step-by-step plan for version 1.
- This file keeps a record of the decisions we made and the bugs we fixed.

## Status
- Planning is done.
- Step 0 (project setup) is done: Vite, TypeScript and Vitest are installed, and the page shows a placeholder heading.
- Next is Step 1 (Katarina data).

## How to run
You need Node.js (v24 works). In a terminal inside this folder:

| Command | What it does |
|---|---|
| `npm install` | Downloads the tools listed in `package.json` into `node_modules/`. Run it once after cloning. |
| `npm run dev` | Starts the site on your computer. Open the link it prints. The page reloads when you save a file. |
| `npm test` | Runs every test once and shows pass/fail. |
| `npm run test:watch` | Re-runs the tests every time you save. |
| `npm run build` | Type-checks the code (`tsc`), then builds the real website into `dist/`. This is what Vercel runs. |

## Project layout (planned)
```
src/
  data/        game numbers, each with a source link and patch
  items/       one file per hand-coded item passive
  ...          formulas, simulation, optimizer, user interface
scripts/       update-items.mjs: downloads item data from Meraki
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
- **Item base stats from Meraki data instead of typing them in:** fewer typos, and easier to update to a new patch.
- **The item filter only removes items whose stats nothing reads:**
  - It's safe because Riftmaker turns HP into AP, so items like Warmog's still count.
  - A test checks that the filter doesn't change the results.
- **Vite + plain TypeScript, no framework:** a small setup that a beginner can read.
- **Vitest instead of Node's built-in test runner:** Vitest reads our TypeScript and Vite settings without extra setup, while Node's runner is stricter about how files import each other. Vitest is only used during development and never ships to the site.
- **Removed the Vite template's demo files (counter, logos, styles):** we didn't need them, and it's less code to read.

## Still open
- Does the dummy also get item stats for its stage? (Step 2)

## Bugs (bug / cause / fix)
None yet.

## Item checklist
Filled in during Step 5. Each legendary item and each boots option gets one of: modelled / checked, irrelevant / not checked yet.
