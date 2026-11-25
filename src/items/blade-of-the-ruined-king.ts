// Blade of The Ruined King, "Mist's Edge": bonus physical damage on-hit equal to 9% (melee) or
// 6% (ranged) of the target's CURRENT health. Under our overkill rule, once the dummy is at 1 HP this is tiny.
// "Clawing Shadows" (a slow) doesn't matter.
import { meleeWielder, type ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Blade_of_the_Ruined_King", patch: "26.23" },
  currentHealthRatioMelee: 0.09,
  currentHealthRatioRanged: 0.06,
};

export const bladeOfTheRuinedKing: ItemPassive = {
  name: "Blade of The Ruined King",
  source: data.source,
  createEffect: (wielder = meleeWielder) => ({
    name: "Blade of The Ruined King",
    onHit: (context) => {
      const ratio = wielder.ranged ? data.currentHealthRatioRanged : data.currentHealthRatioMelee;
      const damage = ratio * context.target.hp;
      context.dealDamage(damage * context.onHitEffectiveness, "physical");
    },
  }),
};
