// Titanic Hydra, "Cleave": bonus physical damage on-hit to the target equal to 1% (melee)
// of KATARINA's maximum health. (The cone damage only hits other enemies.) The active doesn't count.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Titanic_Hydra", patch: PATCH },
  maxHealthRatioMelee: 0.01,
};

export const titanicHydra: ItemPassive = {
  name: "Titanic Hydra",
  source: data.source,
  createEffect: () => ({
    name: "Titanic Hydra",
    onHit: (context) => {
      const damage = data.maxHealthRatioMelee * context.attacker.health;
      context.dealDamage(damage * context.onHitEffectiveness, "physical");
    },
  }),
};
