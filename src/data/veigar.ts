// Veigar's game numbers, read from the wiki on 2026-11-25 (patch 26.23). Drafted by scripts/new-champion.mjs.
// His abilities are plain data (src/simulation/ability-spec.ts): no ability code of his own.
// E (Event Horizon) is a stun cage. His passive's AP (Phenomenal Evil) is a box on the page.
// Every group of numbers has a `source`: where it was read, and for which patch.
import type { AbilitySpec } from "../simulation/ability-spec.ts";

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Veigar/LoL";
const Q_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Veigar/Baleful_Strike";
const W_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Veigar/Dark_Matter";
const R_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Veigar/Primordial_Burst";

export const veigar = {
  name: "Veigar",

  // Ranged champions stand at their attack range from the dummy (items with an aura check it).
  rangeType: {
    source: { url: WIKI_URL, patch: "26.23" },
    type: "ranged" as const,
    attackRange: 550,
  },

  baseStats: {
    source: { url: WIKI_URL, patch: "26.23" },
    health: { base: 580, perLevel: 108 },
    armor: { base: 18, perLevel: 5.2 },
    magicResist: { base: 32, perLevel: 1.3 },
    attackDamage: { base: 52, perLevel: 2.7 },
    attackSpeed: { base: 0.625, bonusPerLevel: 0.0224 },
    moveSpeed: 340,
  },

  adaptiveType: {
    source: { url: WIKI_URL, patch: "26.23" },
    whenTied: "ap" as "ad" | "ap",
  },

  abilities: {
    source: { url: WIKI_URL, patch: "26.23" },
    list: [
      { key: "q", name: "Baleful Strike", maxRank: 5 },
      { key: "w", name: "Dark Matter", maxRank: 5 },
      { key: "e", name: "Event Horizon", maxRank: 5 },
      { key: "r", name: "Primordial Burst", maxRank: 3 },
    ],
  },

  // Phenomenal Evil: each stack gives 1 AP (Eric: a box on the page, filled in by each stage
  // preset). The stacks come from hitting champions and kills, so there's no single right number.
  stackPassive: {
    source: { url: "https://wiki.leagueoflegends.com/en-us/Template:Data_Veigar/Phenomenal_Evil_Power", patch: "26.23" },
    name: "Phenomenal Evil",
    apPerStack: 1,
    stagePresets: { early: 50, mid: 125, late: 200, full: 300 }, // Eric's numbers, not the wiki's
  },

  // The order he levels his abilities: R whenever possible, then max Q, then W, then E.
  skillOrder: {
    start: ["q", "e", "w"],
    priority: ["r", "q", "w", "e"],
  },

  // Each damaging ability. Hits land at 0 s (travel time ignored) unless the ability has a delay.
  specs: {
    // Q: Baleful Strike. One hit (the first of the two enemies it can hit).
    // {{st|Magic Damage|{{ap|80 to 240}} {{as|(+ {{ap|50 to 70}}% AP)}}}}
    q: {
      source: { url: Q_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "magic", base: [80, 120, 160, 200, 240], ratios: { ap: [0.5, 0.55, 0.6, 0.65, 0.7] } }] }],
    },
    // W: Dark Matter. Strikes "after a 1.2 delay from the start of the cast time".
    // {{st|Magic Damage|{{ap|85 to 305}} {{as|(+ {{ap|70 to 110}}% AP)}}}}
    w: {
      source: { url: W_URL, patch: "26.23" },
      hits: [{ time: 1.2, parts: [{ type: "magic", base: [85, 140, 195, 250, 305], ratios: { ap: [0.7, 0.8, 0.9, 1, 1.1] } }] }],
    },
    // R: Primordial Burst. "Increased by 1.5% per 1% of target's missing health. This is capped at
    // 66.66% missing health" (so up to +100%: the wiki's maximum is exactly 2x the minimum).
    // {{st|Minimum Magic Damage|{{ap|175 to 325}} {{as|(+ {{ap|65 to 75}}% AP)}}|Maximum Magic Damage|...x2}}
    r: {
      source: { url: R_URL, patch: "26.23" },
      hits: [
        {
          time: 0,
          parts: [{ type: "magic", base: [175, 250, 325], ratios: { ap: [0.65, 0.7, 0.75] } }],
          modifier: { kind: "missingHealth", maxBonus: 1, missingForMax: 2 / 3 },
        },
      ],
    },
  } satisfies Partial<Record<"q" | "w" | "e" | "r", AbilitySpec>>,
} as const;
