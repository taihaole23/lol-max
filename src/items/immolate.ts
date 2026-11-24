// Shared code for "Immolate" (Sunfire Aegis, Hollow Radiance; they're in the same item group,
// so a build has at most one). Dealing damage turns it on for 3 s, and its own damage keeps
// it on. While on, it deals magic damage every second to enemies next to Katarina:
// base + a share of her BONUS health. During the ult: ticks at 0, 1 and 2 s (see ticking.ts).
import { tickingEffect } from "./ticking.ts";
import type { ItemEffect } from "../simulation/simulate.ts";

export const immolateTiming = {
  secondsBetweenTicks: 1,
  durationSeconds: 3,
};

export function immolateEffect(name: string, baseDamage: number, bonusHealthRatio: number): ItemEffect {
  return tickingEffect({
    name,
    ...immolateTiming,
    triggeredBy: () => true, // any damage, R's or an item's
    tick: (context) => {
      const bonusHealth = context.attacker.health - context.attacker.baseHealth;
      context.dealDamage(baseDamage + bonusHealthRatio * bonusHealth, "magic");
    },
  });
}
