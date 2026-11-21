// The enemy types the user can pick. Each one names a champion and its
// recommended items (used when "Use recommended items" is checked).
// The items were chosen by Eric. They're a design choice, not game data.
//
// Items are listed in buy order. A stage with N items uses boots + the first N,
// so Early = boots + Dream Maker, Mid = boots + Dream Maker + Echoes of Helia, and so on.
// Names must match the item data exactly; Step 5 adds a test that checks this.
import type { ChampionId } from "./champions.ts";

type DummyPreset = {
  champion: ChampionId;
  boots: string;
  itemsInBuyOrder: readonly string[];
};

export const dummyPresets = {
  squishy: {
    champion: "nami",
    boots: "Ionian Boots of Lucidity",
    itemsInBuyOrder: ["Dream Maker", "Echoes of Helia", "Ardent Censer", "Moonstone Renewer", "Redemption"],
  },
  bruiser: {
    champion: "illaoi",
    boots: "Mercury's Treads",
    itemsInBuyOrder: ["Black Cleaver", "Sterak's Gage", "Death's Dance", "Spirit Visage", "Thornmail"],
  },
  tank: {
    champion: "sion",
    boots: "Plated Steelcaps",
    itemsInBuyOrder: ["Hollow Radiance", "Titanic Hydra", "Unending Despair", "Thornmail", "Jak'Sho, The Protean"],
  },
} as const satisfies Record<string, DummyPreset>;

// "squishy" | "bruiser" | "tank"
export type EnemyType = keyof typeof dummyPresets;
