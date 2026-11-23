// Shared code for effects that tick on a timer while they're "on":
// burns (Liandry's Torment) and Immolate auras (Sunfire Aegis, Hollow Radiance).
//
// Some damage turns the effect on (`triggeredBy`), and every new trigger keeps it on for
// `durationSeconds` more (a refresh). While it's on, it ticks every `secondsBetweenTicks`.
// Ticks after the channel ends are thrown away by the simulation (channel window rule).
//
// ASSUMPTION (to check in the Practice Tool): the first tick comes one interval after the
// effect turns on, not right away. That's the safer guess (fewer ticks inside the ult).
import type { DamageInfo, EffectContext, ItemEffect } from "../simulation/simulate.ts";

export function tickingEffect(options: {
  name: string;
  secondsBetweenTicks: number;
  durationSeconds: number;
  triggeredBy: (damage: DamageInfo) => boolean;
  tick: (context: EffectContext) => void;
}): ItemEffect {
  let endsAt: number | undefined; // undefined = the effect is off

  // Books the next tick. Each tick books the one after it, until the effect runs out.
  function bookNextTick(context: EffectContext): void {
    context.schedule(options.secondsBetweenTicks, (later) => {
      if (endsAt === undefined || later.time > endsAt) {
        endsAt = undefined; // ran out: no more refreshes came in time
        return;
      }
      options.tick(later);
      bookNextTick(later);
    });
  }

  return {
    name: options.name,
    afterDamage: (context, damage) => {
      if (!options.triggeredBy(damage)) return;
      const alreadyOn = endsAt !== undefined;
      endsAt = context.time + options.durationSeconds;
      if (!alreadyOn) bookNextTick(context);
    },
  };
}
