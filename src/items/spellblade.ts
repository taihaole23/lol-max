// Shared code for the Spellblade items (Lich Bane, Trinity Force, Iceborn Gauntlet,
// Essence Reaver, Dusk and Dawn). They're all in the Spellblade item group, so a build has at most one.
//
// Casting R grants Spellblade, and the first dagger uses it up (Eric, from playing; the wiki's
// Spellblade notes also say abilities that apply on-hit effects can trigger it). It never procs
// again during the ult: its 1.5 s cooldown would end, but no new ability is cast to grant it again.
//
// Q and E: no proc. Q applies no on-hit effects. E's hit lands before E grants Spellblade (wiki:
// "Shunpo's effects occur before the cast time"), so only a LATER basic attack could use it, and
// basic attacks aren't part of the calculation. (`context.spellbladeReady`, set in abilities.ts.)
//
// ASSUMPTION (to check in the Practice Tool): the Spellblade hit is reduced by R's
// 25 / 30 / 35% on-hit effectiveness, because the wiki calls it on-hit damage.
import type { Attacker, DamageType, EffectContext, ItemEffect } from "../simulation/simulate.ts";

export function spellbladeEffect(
  name: string,
  type: DamageType,
  damage: (attacker: Attacker) => number,
  // Extra things to do when it procs (Dusk and Dawn re-applies on-hit effects).
  afterProc?: (context: EffectContext) => void,
): ItemEffect {
  let used = false;
  return {
    name,
    onHit: (context) => {
      if (used || !context.spellbladeReady) return;
      used = true;
      context.dealDamage(damage(context.attacker) * context.onHitEffectiveness, type);
      afterProc?.(context);
    },
  };
}
