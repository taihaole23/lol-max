// Ezreal's game numbers, read from the wiki on 2026-11-25 (patch 26.23). Drafted by scripts/new-champion.mjs.
// His abilities are plain data (src/simulation/ability-spec.ts): no ability code of his own.
// His passive (Rising Spell Force) isn't modelled.
// Every group of numbers has a `source`: where it was read, and for which patch.
import type { AbilitySpec } from "../simulation/ability-spec.ts";

const WIKI_URL = "https://wiki.leagueoflegends.com/en-us/Ezreal/LoL";
const Q_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Ezreal/Mystic_Shot";
const W_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Ezreal/Essence_Flux";
const E_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Ezreal/Arcane_Shift";
const R_URL = "https://wiki.leagueoflegends.com/en-us/Template:Data_Ezreal/Trueshot_Barrage";

export const ezreal = {
  name: "Ezreal",

  // Ranged champions stand at their attack range from the dummy (items with an aura check it).
  rangeType: {
    source: { url: WIKI_URL, patch: "26.23" },
    type: "ranged" as const,
    attackRange: 550,
  },

  baseStats: {
    source: { url: WIKI_URL, patch: "26.23" },
    health: { base: 600, perLevel: 102 },
    armor: { base: 24, perLevel: 4.2 },
    magicResist: { base: 33, perLevel: 1.1 },
    attackDamage: { base: 60, perLevel: 3.75 },
    attackSpeed: { base: 0.625, bonusPerLevel: 0.025 },
    moveSpeed: 325,
  },

  adaptiveType: {
    source: { url: WIKI_URL, patch: "26.23" },
    whenTied: "ad" as "ad" | "ap",
  },

  abilities: {
    source: { url: WIKI_URL, patch: "26.23" },
    list: [
      { key: "q", name: "Mystic Shot", maxRank: 5 },
      { key: "w", name: "Essence Flux", maxRank: 5 },
      { key: "e", name: "Arcane Shift", maxRank: 5 },
      { key: "r", name: "Trueshot Barrage", maxRank: 3 },
    ],
  },

  // The order he levels his abilities: R whenever possible, then max Q, then E, then W.
  skillOrder: {
    start: ["q", "w", "e"],
    priority: ["r", "q", "e", "w"],
  },

  // Each damaging ability. Hits land at 0 s: travel time is ignored, like every other champion's.
  specs: {
    // Q: Mystic Shot. "Applying on-hit effects and triggering on-attack effects". "Mystic Shot deals
    // basic damage, but also triggers spell effects by also being tagged as spell damage." Abilities
    // that apply on-hit effects can use Spellblade (wiki, Spellblade), so casting Q grants it and Q's
    // own hit uses it. TOTAL AD ratio. It doesn't crit.
    // {{st|Physical Damage|{{ap|20 to 120}} {{as|(+ 130% AD)}} {{as|(+ 40% AP)}}}}
    q: {
      source: { url: Q_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "physical", base: [20, 45, 70, 95, 120], ratios: { ad: 1.3, ap: 0.4 } }] }],
      appliesOnHit: true,
      appliesOnAttack: true,
      spellbladeReadyForHits: true,
      damageKind: "both",
    },
    // W: Essence Flux. The orb marks the dummy; Eric: a 0-damage basic attack detonates it, and that
    // attack applies NO on-hit. So: one hit of the detonation's magic damage.
    // {{st|Bonus Magic Damage|{{ap|80 to 300}} {{as|(+ 115% bonus AD)}} {{as|(+ 100% AP)}}}}
    w: {
      source: { url: W_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "magic", base: [80, 135, 190, 245, 300], ratios: { bonusAd: 1.15, ap: 1 } }] }],
    },
    // E: Arcane Shift. The homing bolt after the blink.
    // {{st|Magic Damage|{{ap|80 to 280}} {{as|(+ 60% bonus AD)}} {{as|(+ 75% AP)}}}}
    e: {
      source: { url: E_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "magic", base: [80, 130, 180, 230, 280], ratios: { bonusAd: 0.6, ap: 0.75 } }] }],
    },
    // R: Trueshot Barrage. The damage against champions (minions take less).
    // {{st|Magic Damage|{{ap|350 to 850}} {{as|(+ 110% bonus AD)}} {{as|(+ 120% AP)}}}}
    r: {
      source: { url: R_URL, patch: "26.23" },
      hits: [{ time: 0, parts: [{ type: "magic", base: [350, 600, 850], ratios: { bonusAd: 1.1, ap: 1.2 } }] }],
    },
  } satisfies Partial<Record<"q" | "w" | "e" | "r", AbilitySpec>>,
} as const;
