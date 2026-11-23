// Hullbreaker, "Skipper" (melee): each on-hit gives a stack. "At maximum stacks, or 4 stacks",
// the next on-hit against a champion uses them all to deal 120% base AD + 5% of Katarina's
// MAXIMUM health as bonus physical damage.
// We read that as: with 4 stacks, the next hit procs. So daggers 1-4 stack, dagger 5 procs,
// 6-9 stack, 10 procs, 11-14 stack, 15 procs: 3 procs per ult.
// A Guinsoo's Phantom Hit is an on-hit too, so it also gives a stack.
// The damage is on-hit, so it's shrunk by R's 25 / 30 / 35%.
// "Boarding Party" (minion buff) doesn't matter.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Hullbreaker", patch: PATCH },
  stacksToProc: 4,
  baseAdRatio: 1.2,
  maxHealthRatio: 0.05,
};

export const hullbreaker: ItemPassive = {
  name: "Hullbreaker",
  createEffect: () => {
    let stacks = 0;
    return {
      name: "Hullbreaker",
      onHit: (context) => {
        if (stacks < data.stacksToProc) {
          stacks++;
          return;
        }
        stacks = 0;
        const { baseAd, health } = context.attacker;
        const damage = data.baseAdRatio * baseAd + data.maxHealthRatio * health;
        context.dealDamage(damage * context.onHitEffectiveness, "physical");
      },
    };
  },
};
