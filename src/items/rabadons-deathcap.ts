// Rabadon's Deathcap, "Magical Opus": +30% ability power.
// The wiki says it "stacks recursively" with other AP sources: it multiplies ALL of
// Katarina's AP, including AP from other passives (Riftmaker, Swiftmarch...). So it runs last.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Rabadon%27s_Deathcap", patch: PATCH },
  apIncrease: 0.3,
};

export const rabadonsDeathcap: ItemPassive = {
  name: "Rabadon's Deathcap",
  stats: {
    step: "multiply",
    apply: (stats) => {
      stats.ap *= 1 + data.apIncrease;
    },
  },
};
