<div align="center">

<img src="public/favicon.svg" width="96" alt="lol-max logo" />

# lol-max

**Which build makes an ability hit the hardest?**

Pick a champion and an ability. lol-max simulates every hit of the cast against a target dummy and shows the top 5 builds.

[**▶ Try it at lol.ericzhong.ca**](https://lol.ericzhong.ca)

![Patch](https://img.shields.io/badge/patch-26.23-f0607a?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-plain-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?style=flat-square&logo=vite&logoColor=white)
![Tests](https://img.shields.io/badge/tests-vitest-6e9f18?style=flat-square&logo=vitest&logoColor=white)
![No backend](https://img.shields.io/badge/backend-none-0a0d13?style=flat-square)

<img src="docs/home.png" alt="The lol-max home page: a champion search over rotating splash art" width="860" />

</div>

---

## What it does

> Does AD, AP or on-hit Katarina get the biggest **Death Lotus**?

It's for fun ("dopamine maxing"), but the math has to be right. Every hit, on-hit effect, item passive and armor or magic resist calculation is simulated in order, and each formula has a unit test.

<div align="center">
<img src="docs/katarina-r.png" alt="Katarina's Death Lotus page: build settings, target dummy and the top 5 builds" width="860" />
</div>

### Features

| | |
|---|---|
| 🏆 **Top 5 builds** | Every legal item combination for Early and Mid. A beam search for Late and Full, tested against the full search. |
| 🎯 **A real target dummy** | Squishy (Nami), bruiser (Illaoi) or tank (Sion), with recommended items, a level, and a health % to start from. |
| 🧮 **Damage breakdowns** | By source (base, AP, AD, on-hit, each item), each item's marginal damage, by damage type, and ability vs. items. |
| 💥 **Crits done right** | "No crit / crit" for abilities that can crit. Yone's passive, Infinity Edge, and Sundered Sky's guaranteed crit on Garen's Q. |
| 🔒 **Your rules** | Lock or ban items, turn boots on or off, set minimum stats, or rank builds by a stat instead of damage. |
| ⚡ **Runs in your browser** | No server and no accounts. The search runs in a Web Worker, so the page never freezes. |

### Champions

| Champion | Modelled abilities |
|---|---|
| <img src="public/icons/champion/katarina.png" width="28" align="center" /> **Katarina** | Q · E · R |
| <img src="public/icons/champion/akali.png" width="28" align="center" /> **Akali** | Q · E · R |
| <img src="public/icons/champion/yone.png" width="28" align="center" /> **Yone** | Q · W · R |
| <img src="public/icons/champion/garen.png" width="28" align="center" /> **Garen** | Q · E · R |
| <img src="public/icons/champion/lux.png" width="28" align="center" /> **Lux** | Q · E · R |
| <img src="public/icons/champion/caitlyn.png" width="28" align="center" /> **Caitlyn** | Q · E · R |
| <img src="public/icons/champion/veigar.png" width="28" align="center" /> **Veigar** | Q · W · R |
| <img src="public/icons/champion/ezreal.png" width="28" align="center" /> **Ezreal** | Q · W · E · R |

Every other champion has a page too, with their abilities marked "coming soon".

## How the numbers stay correct

- **Sourced data.** Ability numbers come from the [League of Legends Wiki](https://wiki.leagueoflegends.com). Item stats come from a saved snapshot of Riot's Data Dragon. Every game number lives in a data file with its source link and patch.
- **Hand-coded item passives.** Each passive that changes damage has its own file in [`src/items/`](src/items) and its own test.
- **Practice Tool checks.** Measurements from the in-game Practice Tool are recorded in [`tests/`](tests) and compared with the calculator.
- **Clear rules.** The dummy never dies (overkill still counts), item actives don't count, and effects count only inside a fixed window. All the rules are on the site's [How it works](https://lol.ericzhong.ca/about) page.

## Run it yourself

You need [Node.js](https://nodejs.org) (v24 works).

```bash
npm install     # once, after cloning
npm run dev     # start the site locally
npm test        # run every test
npm run build   # type-check and build into dist/
```

More commands (patch day, updating items and icons, wiki checks) are listed in [`NOTES.md`](NOTES.md#how-to-run).

## Project layout

```
src/
  data/         game numbers, each with a source link and patch
  items/        one file per hand-coded item passive
  simulation/   the hit-by-hit simulation and each champion's abilities
  optimizer/    item pool, beam search, top 5, explanations (runs in a Web Worker)
  ui/           pages, search, build cards and breakdowns
scripts/        download item data, icons and splash art; patch-day tools
tests/          unit tests and the Practice Tool validation
```

Decisions and their reasons are in [`NOTES.md`](NOTES.md), and the plan is in [`PLAN.md`](PLAN.md).

---

<div align="center">
<sub>Built by Eric Zhong. lol-max is a fan project, not made or endorsed by Riot Games. League of Legends and its icons are trademarks of Riot Games, Inc.</sub>
</div>
