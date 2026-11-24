// Garen's game numbers. This file holds data only; src/simulation/garen-abilities.ts uses it.
// Every group of numbers has a `source`: where it was read, and for which patch.
// Read from the wiki on 2026-11-24. His page says "Last changed V26.14", so they hold on 26.23.

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Garen/LoL";
const Q_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Garen/Decisive_Strike";
const E_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Garen/Judgment";
const R_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Garen/Demacian_Justice";

export const garen = {
  name: "Garen",

  // Melee champions can't buy ranged-only items (src/data/item-groups.ts, meleeCannotBuy).
  rangeType: {
    source: { url: WIKI_URL, patch: "26.23" },
    type: "melee" as const, // wiki: "Range type: Melee" (attack range 175)
  },

  // Stats at level 1 ("base") and how much they grow each level ("perLevel"), from the wiki's infobox.
  baseStats: {
    source: { url: WIKI_URL, patch: "26.23" },
    health: { base: 690, perLevel: 98 },
    armor: { base: 38, perLevel: 4.2 },
    magicResist: { base: 32, perLevel: 1.55 },
    attackDamage: { base: 69, perLevel: 4.5 },
    // `base` is attacks per second; the growth is BONUS attack speed per level (0.0365 = +3.65%).
    attackSpeed: { base: 0.625, bonusPerLevel: 0.0365 },
    moveSpeed: 340,
  },

  // Which stat adaptive force gives when bonus AD and AP are exactly equal (e.g. both 0).
  adaptiveType: {
    source: { url: WIKI_URL, patch: "26.23" },
    whenTied: "ad" as "ad" | "ap", // the wiki says "Adaptive type: Physical"
  },

  // His 4 abilities, in the order the site shows them. Q, E and R are calculated. W (Courage) is
  // damage reduction and a shield, and his passive (Perseverance) is health regen: no damage.
  abilities: {
    source: { url: WIKI_URL, patch: "26.23" },
    list: [
      { key: "q", name: "Decisive Strike", maxRank: 5 },
      { key: "w", name: "Courage", maxRank: 5 },
      { key: "e", name: "Judgment", maxRank: 5 },
      { key: "r", name: "Demacian Justice", maxRank: 3 },
    ],
  },

  // Decisive Strike (Q): his next basic attack is empowered. Lists with 5 entries are by Q rank.
  // - The attack itself: a normal basic attack (100% of his total AD, physical, BASIC damage). "The
  //   enhanced attack will apply other on-hit effects and can critically strike as normal (the bonus
  //   damage does not)."
  // - The bonus: 30 / 60 / ... (+50% AD) physical, "Type: Ability damage" (it triggers spell
  //   effects: Liandry's, Luden's...). It never crits.
  // - Not modelled: a wiki-listed BUG makes the bonus "~6.5%" bigger on a crit. "~" isn't an exact
  //   number, so it's left out (see NOTES.md).
  decisiveStrike: {
    source: { url: Q_URL, patch: "26.23" },
    attackAdRatio: 1, // a basic attack deals 100% of total AD
    physicalBonusDamage: [30, 60, 90, 120, 150],
    bonusAdRatio: 0.5, // of TOTAL AD (the wiki writes "AD", not "bonus AD")
  },

  // Judgment (E): he spins "7 (+ 1 per 25% bonus attack speed) times over 3 seconds".
  // - "Bonus attack speed" counts items AND his per-level growth. No cap on the spin count.
  // - Each spin: 4 / 7 / ... (+40 / 43 / ...% AD) physical, "+25% increased damage against the
  //   nearest enemy hit". With one dummy, it's always the nearest, so every spin gets the +25%.
  // - Crits: "can critically strike for (130% + Infinity Edge 9%) damage", i.e. a crit adds 30% of
  //   the usual crit bonus: 1 + 0.3 × (2 − 1) = 1.3, and with Infinity Edge 1 + 0.3 × (2.3 − 1) = 1.39.
  //   (The template's raw IE numbers, ×1.6, are out of date; its own preview shows ×1.39.)
  // - Armor: "Enemy champions hit 6 times by Judgment are inflicted with 25% armor reduction for
  //   6 seconds" (longer than the spin, so it never wears off here).
  // - "Type: AOE DOT damage": ability damage. It doesn't apply on-hit effects.
  judgment: {
    source: { url: E_URL, patch: "26.23" },
    baseSpins: 7,
    bonusAttackSpeedPerExtraSpin: 0.25,
    spinSeconds: 3,
    physicalDamagePerSpin: [4, 7, 10, 13, 16],
    adRatioPerSpin: [0.4, 0.43, 0.46, 0.49, 0.52], // of TOTAL AD
    nearestEnemyBonus: 0.25,
    critBonusShare: 0.3, // a crit adds this share of the usual crit bonus (130% instead of 200%)
    hitsForArmorReduction: 6,
    armorReduction: 0.25,
  },

  // Demacian Justice (R): true damage, base + a share of the target's MISSING health. Lists with 3
  // entries are by R rank. No AD or AP ratio. Its execute doesn't matter: the dummy never dies.
  // (Lowered to 125 / 200 / 275 in V26.14.)
  demacianJustice: {
    source: { url: R_URL, patch: "26.23" },
    trueBaseDamage: [125, 200, 275],
    missingHealthRatio: [0.25, 0.3, 0.35],
  },

  // The order he levels his abilities, used by the stage presets and when the level changes:
  // levels 1-3 take one point each in `start`; after that each level goes to the first ability in
  // `priority` that can still be ranked up: R whenever possible, then max E, then Q, then W.
  skillOrder: {
    start: ["q", "e", "w"],
    priority: ["r", "e", "q", "w"],
  },
} as const;
