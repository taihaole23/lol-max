// Yone's game numbers. This file holds data only; src/simulation/yone-abilities.ts uses it.
// Every group of numbers has a `source`: where it was read, and for which patch.
// The wiki's numbers for Yone were last changed in V26.21 and still hold on 26.23.

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Yone/LoL";
const PASSIVE_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Yone/Way_of_the_Hunter";
const Q_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Yone/Mortal_Steel";
const W_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Yone/Spirit_Cleave";
const R_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Yone/Fate_Sealed";

export const yone = {
  name: "Yone",

  // Melee champions can't buy ranged-only items (src/data/item-groups.ts, meleeCannotBuy).
  rangeType: {
    source: { url: WIKI_URL, patch: "26.23" },
    type: "melee" as const, // wiki: "rangetype"
  },

  // Stats at level 1 ("base") and how much they grow each level ("perLevel"). Read from the wiki's
  // champion data module. His page's "Special statistics" box shows +115 HP per level: that's Arena
  // only (+10), not Summoner's Rift.
  baseStats: {
    source: { url: WIKI_URL, patch: "26.23" },
    health: { base: 620, perLevel: 105 },
    armor: { base: 33, perLevel: 4.6 },
    magicResist: { base: 32, perLevel: 2.05 },
    attackDamage: { base: 62, perLevel: 2 },
    // `base` is attacks per second; the growth is BONUS attack speed per level (0.035 = +3.5%).
    attackSpeed: { base: 0.625, bonusPerLevel: 0.035 },
    moveSpeed: 345,
  },

  // Which stat adaptive force gives when bonus AD and AP are exactly equal (e.g. both 0).
  adaptiveType: {
    source: { url: WIKI_URL, patch: "26.23" },
    whenTied: "ad" as "ad" | "ap", // the wiki's champion data says "Physical"
  },

  // His passive, Way of the Hunter ("Intent"). A stat rule, applied in src/stats/champion-stats.ts:
  //   - his crit chance from items is doubled (then capped at 100%),
  //   - every 1% crit chance over 100% (after doubling) gives 0.5 bonus AD,
  //   - his crits deal 95% of the usual crit damage (the champion data's "crit_mod" = 0.95),
  //     and that 95% applies to Infinity Edge's +30% too (wiki: "190% + Infinity Edge 28.5%").
  // ("Steel and Spirit", his mixed-damage basic attacks, is about basic attacks: not modelled.)
  critPassive: {
    source: { url: PASSIVE_URL, patch: "26.23" },
    critChanceMultiplier: 2,
    // 0.5 AD per 1% = 50 AD per 100% (crit chance is stored as a fraction: 1 = 100%).
    bonusAdPerExcessCrit: 50,
    critDamageModifier: 0.95,
  },

  // His 4 abilities, in the order the site shows them. Q, W and R are calculated. E (Soul Unbound)
  // deals no damage by itself (it repeats part of the other abilities' damage), so it has no numbers here.
  abilities: {
    source: { url: WIKI_URL, patch: "26.23" },
    list: [
      { key: "q", name: "Mortal Steel", maxRank: 5 },
      { key: "w", name: "Spirit Cleave", maxRank: 5 },
      { key: "e", name: "Soul Unbound", maxRank: 5 },
      { key: "r", name: "Fate Sealed", maxRank: 3 },
    ],
  },

  // Mortal Steel (Q). Lists with 5 entries are by Q rank. One hit of physical damage, TOTAL AD ratio.
  // - Only the AD part can crit: the wiki's crit row is "25 / 50 / ... (+ 199.5% AD)", and
  //   199.5% = 105% × 200% × 0.95. The base damage doesn't grow.
  // - It applies on-hit and on-attack effects to the first enemy hit, at full strength.
  // - On the first enemy hit it's BASIC damage, not ability damage ("will not apply spell effects to
  //   the first target"). So items that need ability damage (Liandry's, Luden's, Shojin...) ignore it.
  // - Gathering Storm (the third cast's dash) hits each target once with the same damage, so it
  //   doesn't change one hit on one dummy.
  mortalSteel: {
    source: { url: Q_URL, patch: "26.23" },
    physicalBaseDamage: [25, 50, 75, 100, 125],
    physicalAdRatio: 1.05,
  },

  // Spirit Cleave (W). Equal parts physical and magic damage, each a flat number plus a share of the
  // dummy's MAXIMUM health. The wiki's total (10 / 20 / ... + 8 / 9 / ... %) is exactly physical + magic.
  // The physical part lands first, in the same game tick. No on-hit effects.
  // (The minion minimum and monster maximum don't apply to a champion dummy.)
  spiritCleave: {
    source: { url: W_URL, patch: "26.23" },
    physicalBaseDamage: [5, 10, 15, 20, 25],
    physicalMaxHealthRatio: [0.04, 0.045, 0.05, 0.055, 0.06],
    magicBaseDamage: [5, 10, 15, 20, 25],
    magicMaxHealthRatio: [0.04, 0.045, 0.05, 0.055, 0.06],
  },

  // Fate Sealed (R). Lists with 3 entries are by R rank. Equal parts magic and physical damage, each
  // with a BONUS AD ratio. The magic part lands first, in the same game tick. No on-hit effects.
  // The wiki's own parameter list has 5 values (200 / 300 / 400 / 500 / 600); its damage table and
  // tooltip use 3 ranks (200 / 400 / 600 total), like every ultimate, so we use those.
  fateSealed: {
    source: { url: R_URL, patch: "26.23" },
    magicBaseDamage: [100, 200, 300],
    magicBonusAdRatio: 0.4,
    physicalBaseDamage: [100, 200, 300],
    physicalBonusAdRatio: 0.4,
  },

  // The order he levels his abilities, used by the stage presets and when the level changes
  // (Eric): levels 1-3 take one point each in `start`; after that each level goes to the first
  // ability in `priority` that can still be ranked up: R whenever possible, then max Q, then W, then E.
  skillOrder: {
    start: ["q", "w", "e"],
    priority: ["r", "q", "w", "e"],
  },
} as const;
