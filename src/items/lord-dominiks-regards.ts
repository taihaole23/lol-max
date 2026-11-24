// Lord Dominik's Regards, "Giant Slayer": deal 1% more damage per 100 of the target's
// BONUS health (health from items), up to 15% at 1500 bonus health. Every damage type.
// (Older versions compared max health with yours; the wiki has the current rule.)
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Lord_Dominik%27s_Regards", patch: "26.23" },
  ampPerHundredBonusHealth: 0.01,
  maxAmp: 0.15,
};

export const lordDominiksRegards: ItemPassive = {
  name: "Lord Dominik's Regards",
  source: data.source,
  createEffect: () => ({
    name: "Lord Dominik's Regards",
    damageMultiplier: (context) => {
      const amp = (context.target.bonusHp / 100) * data.ampPerHundredBonusHealth;
      return 1 + Math.min(amp, data.maxAmp);
    },
  }),
};
