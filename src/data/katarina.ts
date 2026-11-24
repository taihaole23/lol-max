// Katarina's game numbers. This file holds data only; the formulas that use it come in Step 3.
// Every group of numbers has a `source`: where it was read, and for which patch.

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Katarina/LoL";

export const katarina = {
  name: "Katarina",

  // Stats at level 1 ("base") and how much they grow each level ("perLevel").
  // Growth is not added evenly per level; the exact formula is coded in Step 3.
  baseStats: {
    source: { url: WIKI_URL, patch: "26.23" },
    health: { base: 672, perLevel: 108 },
    armor: { base: 32, perLevel: 4.7 },
    magicResist: { base: 32, perLevel: 2.05 },
    attackDamage: { base: 58, perLevel: 3.2 },
    // Attack speed is different: `base` is attacks per second, and the growth is
    // BONUS attack speed per level (0.0274 = +2.74%). Death Lotus scales with bonus
    // attack speed, so this growth adds to her R damage.
    attackSpeed: { base: 0.658, bonusPerLevel: 0.0274 },
    // Move speed doesn't grow with level. Used by Swiftmarch (adaptive force from move speed).
    moveSpeed: 335,
  },

  // Which stat adaptive force gives when bonus AD and AP are exactly equal (e.g. both 0).
  adaptiveType: {
    source: { url: WIKI_URL, patch: "26.23" },
    whenTied: "ap" as "ad" | "ap", // the wiki's champion data says "Magic"
  },

  // Her 4 abilities, in the order the site shows them. `maxRank`: basic abilities go up to 5, R up to 3.
  // Q, E and R are calculated. W (Preparation) deals no damage by itself, so it has no numbers here.
  abilities: {
    source: { url: WIKI_URL, patch: "26.23" },
    list: [
      { key: "q", name: "Bouncing Blade", maxRank: 5 },
      { key: "w", name: "Preparation", maxRank: 5 },
      { key: "e", name: "Shunpo", maxRank: 5 },
      { key: "r", name: "Death Lotus", maxRank: 3 },
    ],
  },

  // Death Lotus (R). Lists with 3 entries are by R rank: [rank 1, rank 2, rank 3].
  deathLotus: {
    source: { url: WIKI_URL, patch: "26.23" },
    channelSeconds: 2.5,
    secondsBetweenDaggers: 0.166,
    // UNCONFIRMED: the wiki doesn't say when the first dagger lands. We assume right
    // at the start of the channel. To check in the Practice Tool (Step 8).
    firstDaggerSeconds: 0,
    // The wiki doesn't state the dagger count. It does give "maximum magic damage"
    // 375 / 562.5 / 750, which is 15 x the per-dagger damage, so a full channel = 15 daggers.
    daggersPerTarget: 15,

    // Magic part of each dagger: base damage + 19% of AP.
    magicBaseDamage: [25, 37.5, 50],
    magicApRatio: 0.19,

    // Physical part of each dagger: 16% of BONUS AD (AD from items, not from levels),
    // and that 16% grows by 50% for every 100% bonus attack speed (so 0.5 per 1.0).
    physicalBonusAdRatio: 0.16,
    physicalBonusAdRatioPerBonusAttackSpeed: 0.5,

    // Each dagger applies on-hit and on-attack effects at this fraction of their damage.
    onHitEffectiveness: [0.25, 0.3, 0.35],
  },

  // Bouncing Blade (Q). Lists with 5 entries are by Q rank: [rank 1, ..., rank 5].
  // It bounces to up to 2 more enemies, but there's only one dummy, so it hits once.
  // The wiki lists no on-hit effects for it, so it applies none.
  bouncingBlade: {
    source: { url: WIKI_URL, patch: "26.23" },
    magicBaseDamage: [80, 115, 150, 185, 220],
    magicApRatio: 0.4,
  },

  // Shunpo (E). Lists with 5 entries are by E rank.
  // One hit of magic damage that applies on-hit effects (at full strength: the wiki gives no
  // smaller number, unlike Death Lotus's 25 / 30 / 35%).
  shunpo: {
    source: { url: WIKI_URL, patch: "26.23" },
    magicBaseDamage: [20, 30, 40, 50, 60],
    // "40% AD": the wiki writes "bonus AD" when it means bonus, so this is TOTAL AD (base + bonus).
    magicAdRatio: 0.4,
    magicApRatio: 0.25,
    onHitEffectiveness: 1,
    // E's own hit uses the Spellblade that casting E grants (Eric, from playing). The wiki doesn't
    // say either way. (We first guessed "no" from the wiki's "Shunpo's effects occur before the
    // cast time"; Eric corrected it.)
    spellbladeReadyForItsHit: true,
  },

  // The order she levels her abilities, used by the stage presets and when the level changes.
  // Not game data: it's the usual Katarina order (Eric asked the presets to follow the recommended
  // build path). Levels 1-3 take one point each in `start`; after that each level goes to the
  // first ability in `priority` that can still be ranked up: R whenever possible, then max Q, then E, then W.
  skillOrder: {
    start: ["q", "e", "w"],
    priority: ["r", "q", "e", "w"],
  },
} as const;
