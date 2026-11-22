// Warmog's Armor, "Warmog's Vitality": bonus health equal to 12% of bonus health FROM ITEMS.
// The wiki notes it only counts items' plain health stats, not health from item passives
// (like Rod of Ages' stacks). "Warmog's Heart" (regeneration) doesn't affect damage.
import { PATCH } from "../data/patch.ts";
import { sumStat } from "../stats/sum-items.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Warmog%27s_Armor", patch: PATCH },
  bonusHealthFromItemHealth: 0.12,
};

export const warmogsArmor: ItemPassive = {
  name: "Warmog's Armor",
  stats: {
    step: "addHealth",
    apply: (stats, context) => {
      stats.health += data.bonusHealthFromItemHealth * sumStat(context.items, "health");
    },
  },
};
