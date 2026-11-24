// Riftmaker.
// "Void Infusion": AP equal to 2% of bonus health.
// "Void Corruption": for each second in combat, deal 2% more damage, up to 4 stacks (8%).
//   During the 2.5 s ult that's 0% → 2% at 1 s → 4% at 2 s. (Its omnivamp at full stacks
//   doesn't change damage.)
import { inCombatAmpEffect } from "./in-combat-amp.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Riftmaker", patch: "26.23" },
  apFromBonusHealth: 0.02,
  ampPerStack: 0.02,
  maxStacks: 4,
  secondsPerStack: 1,
};

export const riftmaker: ItemPassive = {
  name: "Riftmaker",
  source: data.source,
  stats: {
    step: "convert",
    apply: (stats, context) => {
      const bonusHealth = stats.health - context.baseHealth;
      stats.ap += data.apFromBonusHealth * bonusHealth;
    },
  },
  createEffect: () => inCombatAmpEffect("Riftmaker", data.ampPerStack, data.maxStacks, data.secondsPerStack),
};
