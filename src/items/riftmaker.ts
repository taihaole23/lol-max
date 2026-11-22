// Riftmaker, "Void Infusion": AP equal to 2% of bonus health.
// "Void Corruption" (more damage per second in combat) comes in Step 5d-4.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Riftmaker", patch: PATCH },
  apFromBonusHealth: 0.02,
};

export const riftmaker: ItemPassive = {
  name: "Riftmaker",
  stats: {
    step: "convert",
    apply: (stats, context) => {
      const bonusHealth = stats.health - context.baseHealth;
      stats.ap += data.apFromBonusHealth * bonusHealth;
    },
  },
};
