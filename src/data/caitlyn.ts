// Caitlyn's game numbers, read from the wiki on 2026-11-25 (patch 26.23). Drafted by scripts/new-champion.mjs.
// Her abilities are plain data (src/simulation/ability-spec.ts): no ability code of her own.
// W (Yordle Snap Trap) only deals damage through her passive (Headshot), which isn't modelled.
// Every group of numbers has a `source`: where it was read, and for which patch.
import type { AbilitySpec } from "../simulation/ability-spec.ts";

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Caitlyn/LoL";
const Q_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Caitlyn/Piltover_Peacemaker";
const E_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Caitlyn/90_Caliber_Net";
const R_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Caitlyn/Ace_in_the_Hole";

export const caitlyn = {
  name: "Caitlyn",

  // Ranged champions stand at their attack range from the dummy (items with an aura check it).
  rangeType: {
    source: { url: WIKI_URL, patch: "26.23" },
    type: "ranged" as const,
    attackRange: 650,
  },

  baseStats: {
    source: { url: WIKI_URL, patch: "26.23" },
    health: { base: 580, perLevel: 107 },
    armor: { base: 27, perLevel: 4.7 },
    magicResist: { base: 33, perLevel: 1.1 },
    attackDamage: { base: 62, perLevel: 3.8 },
    attackSpeed: { base: 0.681, bonusPerLevel: 0.04 },
    moveSpeed: 325,
  },

  adaptiveType: {
    source: { url: WIKI_URL, patch: "26.23" },
    whenTied: "ad" as "ad" | "ap",
  },

  abilities: {
    source: { url: WIKI_URL, patch: "26.23" },
    list: [
      { key: "q", name: "Piltover Peacemaker", maxRank: 5 },
      { key: "w", name: "Yordle Snap Trap", maxRank: 5 },
      { key: "e", name: "90 Caliber Net", maxRank: 5 },
      { key: "r", name: "Ace in the Hole", maxRank: 3 },
    ],
  },

  // The order she levels her abilities: R whenever possible, then max Q, then E, then W.
  skillOrder: {
    start: ["q", "w", "e"],
    priority: ["r", "q", "e", "w"],
  },

  // Each damaging ability. Hits land at 0 s: travel time is ignored, like every other champion's.
  specs: {
    // Q: Piltover Peacemaker. Full damage to the first enemy it passes through (the dummy).
    // TOTAL AD ratio (the wiki writes "AD"). No on-hit.
    // {{st|Physical Damage|{{ap|50 to 230}} {{as|(+ {{ap|125 to 205}}% AD)}}|Reduced Damage|...}}
    q: {
      source: { url: Q_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "physical", base: [50, 95, 140, 185, 230], ratios: { ad: [1.25, 1.45, 1.65, 1.85, 2.05] } }] }],
    },
    // E: 90 Caliber Net. One hit.
    // {{st|Magic Damage|{{ap|80 to 280}} {{as|(+ 80% AP)}}}}
    e: {
      source: { url: E_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "magic", base: [80, 130, 180, 230, 280], ratios: { ap: 0.8 } }] }],
    },
    // R: Ace in the Hole. After a 1 s channel, one bullet: physical, BONUS AD ratio, "increased by
    // 0 to 30% (+ Infinity Edge 0 to 9%) based on critical strike chance" (wiki template "critical
    // damage", critScaling). It can't crit, so it shows one number. Combat starts when the bullet
    // is fired, so it lands at 0 s like every other one-hit ability.
    // {{st|Physical damage|{{ap|300 to 650}} {{as|(+ 100% bonus AD)}}}}
    r: {
      source: { url: R_URL, patch: "26.23" },
      hits: [
        {
          time: 0,
          parts: [{ type: "physical", base: [300, 475, 650], ratios: { bonusAd: 1 } }],
          modifier: { kind: "critChance", maxBonus: 0.3 },
        },
      ],
    },
  } satisfies Partial<Record<"q" | "w" | "e" | "r", AbilitySpec>>,
} as const;
