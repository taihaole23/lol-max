---
description: Update the site to the newest League patch and work through everything that changed
---

Run patch day for lol-max. Follow CLAUDE.md throughout (data rules, plain-language explanations,
never commit or push). Work through every step without stopping, except where a step says to ask Eric.

## 1. Run the automatic part
Run `npm run patch-day` (takes a few minutes: downloads, wiki check, tests). Then read `patch-report.md`.
- If it says "Already on the newest patch": only handle the wiki section (step 3), then report.
- If a download failed: stop and tell Eric what failed. Don't try to patch it by hand.

## 2. Items (the "Items" section of the report)
- **Hand-coded items that changed:** for each, read the item's wiki page (the `source` url in its
  `src/items/` file). Update the code and its test so they match. Write the new patch on its `source`.
- **New items:** add each to the NOTES.md item checklist as "not checked yet", then read its wiki
  page and decide: does its passive change Death Lotus damage under the rules in CLAUDE.md?
  Set the status ("modelled" needs code + test in `src/items/`, like the existing ones).
- **Removed items:** remove from the checklist; delete the item's `src/items/` file and test if it had one.
- **Passive text changed on irrelevant items:** re-read; change the status if it matters now.
- **Stats only:** nothing to do.

## 3. Wiki (the "Wiki" section of the report)
For each changed piece, decide whether a number the site uses changed:
- Yes: update the number in `src/data/` or `src/items/` (never a magic number inside a formula),
  update or add its test, and write the new patch on its `source`.
- No (wording, links, numbers we don't use): note it in your summary.
- If the wiki and Riot's patch notes disagree, or the wiki looks half-updated: **stop and ask Eric**.
  The wiki often lags a day or two behind the patch.

## 4. The patch-check test
`tests/patch-check.test.ts` lists every source still on the old patch. For each one, open its url
and compare with the code. Then write the new patch on it, but only after actually checking it.
Batch this: Katarina, the dummy champions and the game rules are a few pages each.

## 5. Practice Tool (Eric doesn't re-measure everything every patch)
`tests/practice-tool.test.ts` fails until you've decided, for this patch, which measurements are
still valid. The rules are at the top of `tests/practice-tool-cases.ts`:
- If Katarina's stats, Death Lotus, a game rule (`src/data/game-rules.ts`) or the Practice Tool
  dummy changed in a way that changes a number we use: EVERY measured case is out of date.
- Otherwise, a case is out of date only if one of ITS items changed (stats or passive).
- Out-of-date cases go into `needsRemeasuring` (id → "26.24: <what changed>"). Then set
  `stillValidOnPatch` to the new patch. Never edit `measured` / `hpAfter` numbers yourself.
- Changes that only touch wording, or numbers we don't use, don't make a case out of date.
In the summary, list the cases waiting to be re-measured, with the quickest ones first. If EVERY case
is out of date, say so clearly: the site then has no in-game check until Eric re-measures, and
cases 1-3 (no items, ~2 minutes) are the cheapest way to get one back.

## 6. Finish
1. Once every item and wiki change is handled: `node scripts/check-wiki.mjs --accept`.
2. Delete the old snapshots (`src/data/items.<old>.json`, `src/data/champion-list.<old>.json`).
3. `npm test`, `npx tsc --noEmit` and `npm run test:slow`. Everything must pass.
4. NOTES.md: add a short "Patch <new>" entry: what changed, what was updated, what was checked and found irrelevant.
5. Give Eric a summary in plain language:
   - what changed in the game that matters for the site
   - what you updated
   - what you checked and left alone
   - what's waiting on him (Practice Tool, questions)
   Then remind him to try `npm run dev` and commit in GitHub Desktop.
