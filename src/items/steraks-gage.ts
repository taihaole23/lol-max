// Sterak's Gage, "The Claws that Catch": bonus AD equal to 50% of base AD.
// It's BONUS AD, so it counts for Death Lotus. "Lifeline" (a shield) doesn't affect damage.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Sterak%27s_Gage", patch: PATCH },
  bonusAdFromBaseAd: 0.5,
};

export const steraksGage: ItemPassive = {
  name: "Sterak's Gage",
  stats: {
    step: "convert",
    apply: (stats, context) => {
      stats.bonusAd += data.bonusAdFromBaseAd * context.baseAd;
    },
  },
};
