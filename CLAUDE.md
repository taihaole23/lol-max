# Project: League of Legends ability-damage build optimizer

## What this is
A public website that answers one question: **which build makes a given ability deal the most damage?**
Example: does AD, AP, or on-hit hybrid Katarina get the biggest Death Lotus (R)?
It's for fun ("dopamine maxing"), but the math must be correct. A wrong number kills the site's credibility.

The step-by-step plan for version 1 is in `PLAN.md`. Decisions and their reasons are in `NOTES.md`.

## Version 1 scope (do not expand without asking)
- One ability only: **Katarina R (Death Lotus)**.
- "Damage" = total damage dealt to ONE target dummy during ONE full ult channel (all daggers hit),
  including on-hit / on-attack effects and item effects triggered during the channel.
  Effects that deal damage AFTER the channel ends (burns, DoTs) are counted only for the part inside the channel window. Show this rule on the site.
- Overkill rule: the dummy never dies. It stays at 1 HP and the remaining hits still count in full. Show this rule on the site.
- Optimizer: try every legal combination of items for the chosen game stage, return the **top 5 builds** ranked by damage.
- Each build shows these breakdowns:
  - By source: base, AP ratio, AD ratio, on-hit at the R rank's effectiveness, and each item passive.
  - Each item's marginal damage: damage with the item minus damage without it. The leftover is shown as an "item interactions" line.
  - By damage type: magic, physical and true.
  - Ability vs. item effects.
- Item pool: completed legendary items only. No duplicates, and items that share a unique passive can't be combined.
- Boots:
  - A toggle turns boots on or off. When on, the optimizer chooses tier-2 boots in their own slot. A build never has more than 6 slots.
  - A "mid quest completed" toggle, which needs boots on, switches the choice to tier-3 boots.
  - The extra boots slot from the bot-lane role quest is ignored.
- Preset game stages:

  | Stage | Level | Items with boots on | Items with boots off |
  |---|---|---|---|
  | Early | 6 | 1 + boots | 1 |
  | Mid | 11 | 2 + boots | 2 |
  | Late | 16 | 3 + boots | 3 |
  | Full | 18 | 5 + boots | 6 |

- Target dummy = a champion + the stage's level + a list of items.
  - Its HP / armor / MR = the champion's stats at that level + the items' stats added up.
  - The user picks an enemy type, and the site names the champion: squishy = Nami, bruiser = Illaoi, tank = Sion. The code must make adding more champions a data-only change.
  - Only the champion's base stats and the items' plain HP / armor / MR are used. Champion abilities and item passives are ignored.
  - A "Use recommended items" checkbox, on by default, gives the dummy a recommended item list for its champion and stage. Unchecked, the user picks the dummy's items from the legendary list, up to the stage's slot count.
  - Users can still type in the dummy's HP / armor / MR. Typing a number overrides the calculated value.
- Item filter, used to speed up the search:
  - An item is removed only if no code anywhere reads any of its stats. Riftmaker turns HP into AP, so every item that gives HP stays in.
  - Removed items are listed on the site.
  - A test checks that Early, Mid and Late give the same top 5 builds with and without the filter.
- Runes: NOT in version 1. Planned for version 2.
- Any champion as the dummy: NOT in version 1. Planned for version 2.
- Out of scope: match data, Riot API, accounts, tier lists, anything like u.gg.

## Open decisions (ask Eric before assuming)
- None right now.

## Team
- Built by **Eric Zhong**, a beginner. Public GitHub repo on Eric's account; Eric commits directly to `main` for now.
- Keep NOTES.md good enough that a new contributor could onboard from it.

## Hosting (decided)
- Vercel, in Eric's Vercel account (which already has the domain), connected to the GitHub repo; auto-deploys on push to `main`.
- Domain: **lol.ericzhong.ca** (subdomain of Eric's domain). The site is NOT served under a path like /lol, so no base-path config is needed.

## Data rules
- Ability data comes from the League of Legends Wiki (wiki.leagueoflegends.com), or from the Meraki lolstaticdata project, which is sourced from the wiki.
- Riot's Data Dragon is fine for item and rune lists, but its ability numbers are unreliable.
- Item base stats are loaded from a saved snapshot of Data Dragon's data (`scripts/update-items.mjs`) and are never typed in by hand. Only item passives are hand-coded.
  - Stats are read from each item's description text, because Data Dragon's `stats` field leaves out penetration and lethality.
  - Meraki is NOT used for items or champion stats: its data was out of date (see NOTES.md).
  - `tests/items-wiki-check.test.ts` compares a few items with the wiki, as an independent check on Data Dragon.
- Every game number lives in a data file with a source link and the patch it's from. No magic numbers inside formulas.
- Known: Death Lotus on-hit/on-attack effectiveness is 25 / 30 / 35% by R rank (not 33%).
- Each item passive that matters is hand-coded and has its own test.
- NOTES.md keeps a checklist of every legendary item, each marked "modelled", "checked, irrelevant" or "not checked yet".

## Correctness
- Unit tests for every formula.
- Validation: compare the calculator against real numbers measured in the in-game Practice Tool for a few builds.
  - Use a "neutral" rune page that can't add damage to R.
  - Record the measurements in a test file with the patch number.

## Tech
- Static site, no backend, no secrets. Everything runs in the browser.
- Keep the stack small and beginner-readable: Vite + plain TypeScript, no framework. Confirm before adding any dependency.
- The optimizer runs in a Web Worker so the page doesn't freeze.
- Hosted from a public GitHub repo with auto-deploy on push; custom domain.

## How to work with Eric (important)
Eric is learning. He wants to understand every line, not just get a working site.
- Work in small steps. One feature at a time.
- Before writing code for a new feature, explain the plan in plain language and wait for approval.
- After each change, explain what changed and why, in plain language. Define any new term the first time it appears.
- For small pieces (under ~20 lines), offer hints first so he can try writing them himself.
- Never commit secrets. Keep `.gitignore` up to date.
- He commits through GitHub Desktop himself. Do not commit or push unless asked.
- Keep `NOTES.md` updated with decisions ("chose X over Y because...") and bugs ("bug / cause / fix").
