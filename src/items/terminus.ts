// Terminus.
// "Shadow": 30 + 10% bonus AD + 10% AP bonus magic damage on-hit.
// "Juxtaposition": on-hit effects against champions alternate between Light and Dark hits.
//   Each Dark hit gives 10% armor AND magic penetration, up to 3 stacks (30%). Stacks last
//   5 s, longer than the ult. Light hits give Katarina armor / MR, which doesn't change damage.
//   The wiki says effects that apply on-hit count, so every dagger is a hit (and so is
//   Dusk and Dawn's repeat).
//
// ASSUMPTION (to check in the Practice Tool): the first hit is Light, so Dark hits are the
// 2nd, 4th and 6th. The wiki doesn't say; Light first is the safer guess (less damage).
// A Dark stack counts for damage after that hit, not for the hit's own on-hit damage.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Terminus", patch: PATCH },
  baseDamage: 30,
  bonusAdRatio: 0.1,
  apRatio: 0.1,
  penetrationPerDarkStack: 0.1,
  maxDarkStacks: 3,
};

export const terminus: ItemPassive = {
  name: "Terminus",
  source: data.source,
  createEffect: () => {
    let hits = 0;
    const darkStackTimes: number[] = [];

    return {
      name: "Terminus",
      onHit: (context) => {
        const { bonusAd, ap } = context.attacker;
        const damage = data.baseDamage + data.bonusAdRatio * bonusAd + data.apRatio * ap;
        context.dealDamage(damage * context.onHitEffectiveness, "magic");

        hits++;
        const isDark = hits % 2 === 0; // Light, Dark, Light, Dark...
        if (isDark && darkStackTimes.length < data.maxDarkStacks) darkStackTimes.push(context.time);
      },
      shred: (time) => {
        const stacks = darkStackTimes.filter((t) => t < time).length;
        const penetration = stacks * data.penetrationPerDarkStack;
        return { armor: { percentPenetration: penetration }, magic: { percentPenetration: penetration } };
      },
    };
  },
};
