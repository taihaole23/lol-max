// Shadowflame, "Cinderbloom": magic and true damage critically strikes for 120% against
// targets that are ALREADY below 40% of their max health (checked before the hit lands).
// Nothing else in our builds changes crit damage for magic / true damage, so it's × 1.2.
//
// Small simplification: R's magic damage is stored as two pieces (base, AP ratio). If the
// base piece takes the dummy below 40%, the AP ratio piece of the same dagger gets the bonus,
// although in the game they're one hit. That's at most one dagger's AP part per ult.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Shadowflame", patch: PATCH },
  healthThreshold: 0.4,
  critDamage: 1.2,
};

export const shadowflame: ItemPassive = {
  name: "Shadowflame",
  createEffect: () => ({
    name: "Shadowflame",
    damageMultiplier: (context, damage) => {
      if (damage.type === "physical") return 1;
      const belowThreshold = context.target.hp < data.healthThreshold * context.targetMaxHp;
      return belowThreshold ? data.critDamage : 1;
    },
  }),
};
