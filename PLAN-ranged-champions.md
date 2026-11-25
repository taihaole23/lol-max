# Plan: ranged champions (Lux, Caitlyn, Veigar, Ezreal)

Status: **done** (Nov 25, 2026). What was built, and the decisions made on the way, are in NOTES.md
("Ranged champions" in Status and Decisions). Veigar's W uses the wiki's 1.2 s, not 1.221.
Numbers below were read from the wiki on 2026-11-24 (patch 26.23). Re-check them before building,
since a patch may have changed them.

## Eric's decisions
- **Veigar R:** add a "dummy's health before R" box (a %, default 100%). R's missing-health bonus
  uses it. Our default: the whole hit uses that health, so items based on current health (BotRK) see it too.
- **Ezreal W:** the orb lands, then a 0-damage auto detonates it. The auto applies **no** on-hit.
  Count the detonation plus item effects the W hit itself starts.
- **Caitlyn W:** "deals no damage" (its damage comes through Headshot, her passive, which isn't modelled).
- **Position:** ranged champions stand **at their attack range**, not next to the dummy.
  Melee champions still stand next to it. The rule shown on the site changes to say so.
- **Veigar stacks:** a "Phenomenal Evil stacks" box (1 AP each). Stage presets: Early 50, Mid 125, Late 200, Full 300. Editable.
- Passives are not modelled (same as Katarina and Akali).

## Steps (stop after each one for review)

**A. Ranged support** (the only real engine work)
- `rangeType.type` may be `"ranged"`, and each data file stores its attack range (wiki).
- The item pool: Runaan's Hurricane becomes buyable for ranged champions only.
- Items with melee / ranged numbers get both, picked by range type, each with a test:
  Blade of the Ruined King, Eclipse, Experimental Hexplate, Titanic Hydra, Hullbreaker,
  Kraken Slayer, Voltaic Cyclosword, Bastionbreaker.
- Items that need you to be near the target get a radius (wiki) and a "is the dummy inside it?"
  check: Sunfire, Hollow Radiance, Abyssal Mask and any other aura found in `src/items/`.
  - Check how the game measures each distance: attack range is edge to edge (includes both
    champions' sizes), some item radiuses are centre to centre. Close cases (Abyssal Mask's aura vs.
    a 550-range champion) get a note in NOTES.md.

**B. Lux** (Q, E, R; W is a shield: "deals no damage")
- Q 80 / 120 / 160 / 200 / 240 (+75% AP), magic, one hit.
- E 65 / 115 / 165 / 215 / 265 (+80% AP), magic, one hit (detonation).
- R 300 / 400 / 500 (+120% AP), magic, one hit.
- Attack range 550. Skill order: R, then Q, E, W (check the usual order before building).

**C. Caitlyn** (Q, E, R; W "deals no damage")
- Q 50 / 95 / 140 / 185 / 230 (+125 / 145 / 165 / 185 / 205% AD), physical, full damage on the first target.
- E 80 / 130 / 180 / 230 / 280 (+80% AP), magic.
- R 300 / 475 / 650 (+100% bonus AD), physical. Increased by 0–30% (+ Infinity Edge 0–9%) based on
  crit chance. It doesn't crit, so it shows one number. Find the exact curve on the wiki.
- Attack range 650. Skill order: R, then Q, E, W.

**D. Veigar** (Q, W, R; E is a cage: "deals no damage")
- Q 80 / 120 / 160 / 200 / 240 (+50 / 55 / 60 / 65 / 70% AP), magic.
- W 85 / 140 / 195 / 250 / 305 (+70 / 80 / 90 / 100 / 110% AP), magic, lands 1.221 s after the cast.
- R 175 / 250 / 325 (+65 / 70 / 75% AP), magic, increased by 0–100% based on the dummy's missing
  health. The history section says 1.5% per 1% missing (max at 33% health or less): **confirm on the
  wiki's data template before using it.**
- The stacks box and the health box (see decisions; the health box may already exist from Garen R).
- Attack range 550. Skill order: R, then Q, W, E.

**E. Ezreal** (Q, W, E, R)
- Q 20 / 45 / 70 / 95 / 120 (+130% AD, +40% AP), physical. Counts as BOTH basic and ability damage:
  applies on-hit / on-attack AND triggers items that need ability damage (new switch; Yone's Q was
  basic only). Check on the wiki whether it triggers Spellblade.
- W 80 / 135 / 190 / 245 / 300 (+115% bonus AD, +100% AP), magic (ratios changed in V26.23).
- E 80 / 130 / 180 / 230 / 280 (+60% bonus AD, +75% AP), magic.
- R 350 / 600 / 850 (+110% bonus AD, +120% AP), magic (against champions).
- Attack range 550. Skill order: R, then Q, E, W (check: Ezreal often maxes W second).

## Base stats read on 2026-11-24 (base + per level)

| | Lux | Veigar | Caitlyn | Ezreal |
|---|---|---|---|---|
| HP | 580 + 99 | 580 + 108 | 580 + 107 | 600 + 102 |
| Armor | 21 + 5.2 | 18 + 5.2 | 27 + 4.7 | 24 + 4.2 |
| MR | 30 + 1.3 | 32 + 1.3 | 33 + 1.1 | 33 + 1.1 |
| AD | 54 + 3.3 | 52 + 2.7 | 62 + 3.8 | 60 + 3.75 |
| Attack speed | 0.669, +3% | 0.625, +2.24% | 0.681, +4% | 0.625, +2.5% |
| Move speed | 330 | 340 | 325 | 325 |
| Attack range | 550 | 550 | 650 | 550 |
