// Overlord's Bloodmail, "Tyranny": bonus AD equal to 2.5% of bonus health.
// "Retribution" grows with Katarina's MISSING health. The dummy never hits back,
// so she's always at full health and it gives 0.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Overlord%27s_Bloodmail", patch: PATCH },
  bonusAdFromBonusHealth: 0.025,
};

export const overlordsBloodmail: ItemPassive = {
  name: "Overlord's Bloodmail",
  source: data.source,
  stats: {
    step: "convert",
    apply: (stats, context) => {
      const bonusHealth = stats.health - context.baseHealth;
      stats.bonusAd += data.bonusAdFromBonusHealth * bonusHealth;
    },
  },
};
