// Kraken Slayer, "Bring It Down" (melee): each on-hit gives a stack, up to 2. At 2 stacks, the
// next on-hit uses them to deal bonus physical damage: 150 at levels 1-8, then +5 per level
// (200 at 18). It's increased by up to 75% based on the dummy's MISSING health.
// Daggers trigger it (Eric, from playing), so daggers 3, 6, 9, 12 and 15 proc it.
// A Guinsoo's Phantom Hit is an on-hit too, so it also gives a stack (wiki, Guinsoo's page).
// The damage is on-hit, so it's shrunk by R's 25 / 30 / 35%.
// ASSUMPTION: the missing-health bonus grows in a straight line (0% missing → +0%, 100% → +75%).
//   The wiki's "0 to 75 by 5" might mean it goes up in 5% steps instead.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Kraken_Slayer", patch: PATCH },
  stacksToProc: 2,
  baseDamage: 150,
  damagePerLevelAfter: 5,
  levelGrowthStartsAfter: 8, // level 9 = 155
  maxMissingHealthIncrease: 0.75,
};

export function krakenDamage(level: number): number {
  return data.baseDamage + data.damagePerLevelAfter * Math.max(0, level - data.levelGrowthStartsAfter);
}

export const krakenSlayer: ItemPassive = {
  name: "Kraken Slayer",
  createEffect: () => {
    let stacks = 0;
    return {
      name: "Kraken Slayer",
      onHit: (context) => {
        if (stacks < data.stacksToProc) {
          stacks++;
          return;
        }
        stacks = 0;
        const missing = 1 - context.target.hp / context.targetMaxHp;
        const damage = krakenDamage(context.attacker.level) * (1 + data.maxMissingHealthIncrease * missing);
        context.dealDamage(damage * context.onHitEffectiveness, "physical");
      },
    };
  },
};
