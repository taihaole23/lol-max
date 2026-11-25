// Lux's game numbers, read from the wiki on 2026-11-25 (patch 26.23). Drafted by scripts/new-champion.mjs.
// Her abilities are plain data (src/simulation/ability-spec.ts): no ability code of her own.
// W (Prismatic Barrier) is a shield, and her passive (Illumination) isn't modelled.
// Every group of numbers has a `source`: where it was read, and for which patch.
import type { AbilitySpec } from "../simulation/ability-spec.ts";

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Lux/LoL";
const Q_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Lux/Light_Binding";
const E_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Lux/Lucent_Singularity";
const R_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Lux/Final_Spark";

export const lux = {
  name: "Lux",

  // Ranged champions stand at their attack range from the dummy (items with an aura check it).
  rangeType: {
    source: { url: WIKI_URL, patch: "26.23" },
    type: "ranged" as const,
    attackRange: 550,
  },

  baseStats: {
    source: { url: WIKI_URL, patch: "26.23" },
    health: { base: 580, perLevel: 99 },
    armor: { base: 21, perLevel: 5.2 },
    magicResist: { base: 30, perLevel: 1.3 },
    attackDamage: { base: 54, perLevel: 3.3 },
    attackSpeed: { base: 0.669, bonusPerLevel: 0.03 },
    moveSpeed: 330,
  },

  adaptiveType: {
    source: { url: WIKI_URL, patch: "26.23" },
    whenTied: "ap" as "ad" | "ap",
  },

  abilities: {
    source: { url: WIKI_URL, patch: "26.23" },
    list: [
      { key: "q", name: "Light Binding", maxRank: 5 },
      { key: "w", name: "Prismatic Barrier", maxRank: 5 },
      { key: "e", name: "Lucent Singularity", maxRank: 5 },
      { key: "r", name: "Final Spark", maxRank: 3 },
    ],
  },

  // The order she levels her abilities (see ability-ranks.ts, recommendedRanks): R whenever possible,
  // then max E, then Q, then W (the usual order for mid lane Lux).
  skillOrder: {
    start: ["e", "q", "w"],
    priority: ["r", "e", "q", "w"],
  },

  // Each damaging ability. Hits land at 0 s: travel time is ignored, like every other champion's.
  specs: {
    // Q: Light Binding. One hit (the first of the two enemies it can hit).
    // {{st|Magic Damage|{{ap|80 to 240}} {{as|(+ 75% AP)}}}}
    q: {
      source: { url: Q_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "magic", base: [80, 120, 160, 200, 240], ratios: { ap: 0.75 } }] }],
    },
    // E: Lucent Singularity. Only the recast (detonation) deals damage: she recasts right away.
    // {{st|Magic Damage|{{ap|65 to 265}} {{as|(+ 80% AP)}}}}
    e: {
      source: { url: E_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "magic", base: [65, 115, 165, 215, 265], ratios: { ap: 0.8 } }] }],
    },
    // R: Final Spark. One hit.
    // {{st|Magic Damage|{{ap|300 to 500}} {{as|(+ 120% AP)}}}}
    r: {
      source: { url: R_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "magic", base: [300, 400, 500], ratios: { ap: 1.2 } }] }],
    },
  } satisfies Partial<Record<"q" | "w" | "e" | "r", AbilitySpec>>,
} as const;
