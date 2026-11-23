// Shared code for "for each second in combat, deal X% more damage, up to N stacks"
// (Liandry's Torment "Suffering", Riftmaker "Void Corruption").
//
// Combat starts when R is cast (time 0) with 0 stacks, so the first stack comes at 1 s.
// ASSUMPTION (to check in the Practice Tool): a stack is added exactly every second.
import type { ItemEffect } from "../simulation/simulate.ts";

export function inCombatAmpEffect(
  name: string,
  ampPerStack: number, // 0.02 = 2% more damage per stack
  maxStacks: number,
  secondsPerStack: number,
): ItemEffect {
  return {
    name,
    // It's "deal more damage", so every piece counts: R's and items', any damage type.
    damageMultiplier: (context) => {
      const stacks = Math.min(Math.floor(context.time / secondsPerStack), maxStacks);
      return 1 + stacks * ampPerStack;
    },
  };
}
