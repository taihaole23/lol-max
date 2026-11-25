// Titanic Hydra, "Cleave": bonus physical damage on-hit to the target equal to 1% (melee)
// of KATARINA's maximum health. (The cone damage only hits other enemies.) The active doesn't count.
import { meleeWielder, type ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Titanic_Hydra", patch: "26.23" },
  maxHealthRatioMelee: 0.01,
  maxHealthRatioRanged: 0.005, // wiki: 1% melee, 0.5% ranged
};

export const titanicHydra: ItemPassive = {
  name: "Titanic Hydra",
  source: data.source,
  createEffect: (wielder = meleeWielder) => ({
    name: "Titanic Hydra",
    onHit: (context) => {
      const ratio = wielder.ranged ? data.maxHealthRatioRanged : data.maxHealthRatioMelee;
      const damage = ratio * context.attacker.health;
      context.dealDamage(damage * context.onHitEffectiveness, "physical");
    },
  }),
};
