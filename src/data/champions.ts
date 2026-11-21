// Champions that can be the target dummy. Only HP, armor and MR are stored,
// because that's all a dummy uses. Adding a champion = adding one entry here.
// Values are "base" (level 1) and "perLevel" growth, read from each champion's wiki infobox.
import { PATCH } from "./patch.ts";

const WIKI = "https://wiki.leagueoflegends.com/en-us/";

export const champions = {
  nami: {
    name: "Nami",
    source: { url: WIKI + "Nami/LoL", patch: PATCH },
    health: { base: 560, perLevel: 88 },
    armor: { base: 29, perLevel: 5.2 },
    magicResist: { base: 30, perLevel: 1.3 },
  },
  illaoi: {
    name: "Illaoi",
    source: { url: WIKI + "Illaoi/LoL", patch: PATCH },
    health: { base: 656, perLevel: 115 },
    armor: { base: 35, perLevel: 5 },
    magicResist: { base: 32, perLevel: 2.05 },
  },
  sion: {
    name: "Sion",
    source: { url: WIKI + "Sion/LoL", patch: PATCH },
    health: { base: 655, perLevel: 95 },
    armor: { base: 36, perLevel: 4.2 },
    magicResist: { base: 32, perLevel: 2.05 },
  },
} as const;

// "nami" | "illaoi" | "sion", worked out from the object above.
export type ChampionId = keyof typeof champions;
