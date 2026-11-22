// Terminus, "Shadow": 30 + 10% bonus AD + 10% AP bonus magic damage on-hit.
// "Juxtaposition" (armor / magic pen stacks) comes in Step 5d-3.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Terminus", patch: PATCH },
  baseDamage: 30,
  bonusAdRatio: 0.1,
  apRatio: 0.1,
};

export const terminus: ItemPassive = {
  name: "Terminus",
  createEffect: () => ({
    name: "Terminus",
    onHit: (context) => {
      const { bonusAd, ap } = context.attacker;
      const damage = data.baseDamage + data.bonusAdRatio * bonusAd + data.apRatio * ap;
      context.dealDamage(damage * context.onHitEffectiveness, "magic");
    },
  }),
};
