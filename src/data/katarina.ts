// Katarina's game numbers. This file holds data only; the formulas that use it come in Step 3.
// Every group of numbers has a `source`: where it was read, and for which patch.
import { PATCH } from "./patch.ts";

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Katarina/LoL";

export const katarina = {
  name: "Katarina",

  // Stats at level 1 ("base") and how much they grow each level ("perLevel").
  // Growth is not added evenly per level; the exact formula is coded in Step 3.
  baseStats: {
    source: { url: WIKI_URL, patch: PATCH },
    health: { base: 672, perLevel: 108 },
    armor: { base: 32, perLevel: 4.7 },
    magicResist: { base: 32, perLevel: 2.05 },
    attackDamage: { base: 58, perLevel: 3.2 },
    // Attack speed is different: `base` is attacks per second, and the growth is
    // BONUS attack speed per level (0.0274 = +2.74%). Death Lotus scales with bonus
    // attack speed, so this growth adds to her R damage.
    attackSpeed: { base: 0.658, bonusPerLevel: 0.0274 },
  },

  // Death Lotus (R). Lists with 3 entries are by R rank: [rank 1, rank 2, rank 3].
  deathLotus: {
    source: { url: WIKI_URL, patch: PATCH },
    channelSeconds: 2.5,
    secondsBetweenDaggers: 0.166,
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
} as const;
