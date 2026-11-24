// Akali's game numbers. This file holds data only; src/simulation/akali-abilities.ts uses it.
// Every group of numbers has a `source`: where it was read, and for which patch.
// The wiki's numbers for Akali were last changed in V26.17 and still hold on 26.23.

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Akali/LoL";
const Q_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Akali/Five_Point_Strike";
const E_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Akali/Shuriken_Flip";
const R_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Akali/Perfect_Execution";

export const akali = {
  name: "Akali",

  // Melee champions can't buy ranged-only items (src/data/item-groups.ts, meleeCannotBuy).
  rangeType: {
    source: { url: WIKI_URL, patch: "26.23" },
    type: "melee" as const, // wiki: "rangetype"
  },

  // Stats at level 1 ("base") and how much they grow each level ("perLevel"). Read from the wiki's
  // champion data module (the infobox on her page shows the same numbers). The page's "Special
  // statistics" box shows +121 HP per level: that's Arena only (+2), not Summoner's Rift.
  baseStats: {
    source: { url: WIKI_URL, patch: "26.23" },
    health: { base: 600, perLevel: 119 },
    armor: { base: 23, perLevel: 4.7 },
    magicResist: { base: 37, perLevel: 2.05 },
    attackDamage: { base: 62, perLevel: 3.3 },
    // `base` is attacks per second; the growth is BONUS attack speed per level (0.032 = +3.2%).
    attackSpeed: { base: 0.625, bonusPerLevel: 0.032 },
    moveSpeed: 345,
  },

  // Which stat adaptive force gives when bonus AD and AP are exactly equal (e.g. both 0).
  adaptiveType: {
    source: { url: WIKI_URL, patch: "26.23" },
    whenTied: "ad" as "ad" | "ap", // the wiki's champion data says "Physical"
  },

  // Her 4 abilities, in the order the site shows them. Q, E and R are calculated. W (Twilight
  // Shroud) deals no damage, so it has no numbers here.
  abilities: {
    source: { url: WIKI_URL, patch: "26.23" },
    list: [
      { key: "q", name: "Five Point Strike", maxRank: 5 },
      { key: "w", name: "Twilight Shroud", maxRank: 5 },
      { key: "e", name: "Shuriken Flip", maxRank: 5 },
      { key: "r", name: "Perfect Execution", maxRank: 3 },
    ],
  },

  // Five Point Strike (Q). Lists with 5 entries are by Q rank. One hit of magic damage.
  // "65% AD": the wiki writes "bonus AD" when it means bonus (it does for R), so this is TOTAL AD.
  // It applies no on-hit effects (wiki: TriggerOnHitEvents "Not Owned").
  fivePointStrike: {
    source: { url: Q_URL, patch: "26.23" },
    magicBaseDamage: [45, 70, 95, 120, 145],
    magicAdRatio: 0.65,
    magicApRatio: 0.6,
  },

  // Shuriken Flip (E). Two casts, both magic damage, both TOTAL AD ratios, no on-hit effects.
  // The wiki's total (70 / 140 / ... + 100% AD + 110% AP) is exactly first cast + recast.
  shurikenFlip: {
    source: { url: E_URL, patch: "26.23" },
    first: { magicBaseDamage: [21, 42, 63, 84, 105], magicAdRatio: 0.3, magicApRatio: 0.33 },
    recast: { magicBaseDamage: [49, 98, 147, 196, 245], magicAdRatio: 0.7, magicApRatio: 0.77 },
    // Eric: she recasts right away. The wiki gives no wait before the recast (only a 3 s window
    // to use it), so both land at the same moment.
    recastSeconds: 0,
  },

  // Perfect Execution (R). Lists with 3 entries are by R rank. No on-hit effects.
  perfectExecution: {
    source: { url: R_URL, patch: "26.23" },
    // First cast (R1): magic damage. The wiki's damage table says magic and its tooltip text says
    // physical; Eric confirmed magic from playing.
    first: { magicBaseDamage: [110, 220, 330], magicBonusAdRatio: 0.5, magicApRatio: 0.3 },
    // Recast (R2): magic damage, raised by the dummy's missing health (below).
    recast: { magicBaseDamage: [70, 140, 210], magicApRatio: 0.3 },
    // "Perfect Execution can be recast after a 2.5-second static cooldown" (wiki). Eric: she
    // recasts as soon as allowed. UNCONFIRMED: whether the 2.5 s counts from R1's cast or from R1's
    // hit (R1 has a 0.25 s cast time). We use 2.5 s between the two hits.
    recastSeconds: 2.5,
    // R2's damage is raised by 0% to 200%, growing evenly with the dummy's missing health and
    // reaching 200% at 70% missing health (wiki table, sent by Eric: "2.86% per 1% of target's
    // missing health, capped at 70% missing health"; 2.86 is 200 / 70 rounded).
    // The wiki's minimum and maximum (70 / 140 / 210 + 30% AP and 210 / 420 / 630 + 90% AP) are
    // exactly 1x and 3x.
    maxMissingHealthBonus: 2,
    missingHealthForMaxBonus: 0.7,
  },

  // The order she levels her abilities, used by the stage presets and when the level changes
  // (Eric): levels 1-3 take one point each in `start`; after that each level goes to the first
  // ability in `priority` that can still be ranked up: R whenever possible, then max Q, then E, then W.
  skillOrder: {
    start: ["q", "e", "w"],
    priority: ["r", "q", "e", "w"],
  },
} as const;
