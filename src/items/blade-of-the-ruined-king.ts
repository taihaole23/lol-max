// Blade of The Ruined King, "Mist's Edge": bonus physical damage on-hit equal to 9% (melee)
// of the target's CURRENT health. Under our overkill rule, once the dummy is at 1 HP this is tiny.
// "Clawing Shadows" (a slow) doesn't matter.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Blade_of_the_Ruined_King", patch: PATCH },
  currentHealthRatioMelee: 0.09,
};

export const bladeOfTheRuinedKing: ItemPassive = {
  name: "Blade of The Ruined King",
  createEffect: () => ({
    name: "Blade of The Ruined King",
    onHit: (context) => {
      const damage = data.currentHealthRatioMelee * context.target.hp;
      context.dealDamage(damage * context.onHitEffectiveness, "physical");
    },
  }),
};
