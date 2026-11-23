// Yun Tal Wildarrows, "Flurry": launching an attack at a champion gives +30% bonus attack speed
// for 6 s (30 s cooldown). Dagger 1 counts as that attack, so daggers 2-15 get it (on-attack
// bonuses help the next dagger, see simulate.ts). 6 s is longer than the ult.
// ASSUMPTION (to check in the Practice Tool): daggers trigger Flurry. They apply on-attack
//   effects (wiki), and Flurry works like one.
// "Practice Makes Lethal" (permanent crit chance per attack) starts at 0 (stacks earned by
// fighting), and crit doesn't change R's damage, so it's left out.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Yun_Tal_Wildarrows", patch: PATCH },
  flurryBonusAttackSpeed: 0.3,
};

export const yunTalWildarrows: ItemPassive = {
  name: "Yun Tal Wildarrows",
  source: data.source,
  createEffect: () => {
    let used = false;
    return {
      name: "Yun Tal Wildarrows",
      onAttack: (context) => {
        if (used) return;
        used = true;
        context.attacker.bonusAttackSpeed += data.flurryBonusAttackSpeed;
      },
    };
  },
};
