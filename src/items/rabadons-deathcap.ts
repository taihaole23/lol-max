// Rabadon's Deathcap, "Magical Opus": +30% ability power.
// The wiki says it "stacks recursively" with other AP sources: it multiplies ALL of
// Katarina's AP, including AP from other passives (Riftmaker, Swiftmarch...).
// Other % AP bonuses (Blackfire Torch) ADD to its 30% instead of multiplying with it,
// so it doesn't multiply AP itself: it adds to `apPercentBonus`, and katarinaStats
// multiplies AP by (1 + apPercentBonus) at the very end.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Rabadon%27s_Deathcap", patch: PATCH },
  apIncrease: 0.3,
};

export const rabadonsDeathcap: ItemPassive = {
  name: "Rabadon's Deathcap",
  source: data.source,
  stats: {
    step: "percent",
    apply: (stats) => {
      stats.apPercentBonus += data.apIncrease;
    },
  },
};
