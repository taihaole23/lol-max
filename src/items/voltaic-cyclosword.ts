// Voltaic Cyclosword. An Energized item (bar full at R cast, see energized.ts).
// "Galvanize": dealing ABILITY damage to a champion triggers the Energized attack's effects.
//   So R's first damage triggers it, not dagger 1's on-hit. It's not on-hit damage, so R's
//   25 / 30 / 35% doesn't shrink it. The wiki says its damage lands BEFORE the triggering damage.
// "Firmament": deals bonus physical damage equal to 8% of the dummy's CURRENT health, and gives
//   +15 lethality for 4 s, granted before its own damage. 4 s is longer than the ult, so every
//   physical hit from then on gets it (lethality = flat armor pen, 1 for 1).
// The bar can't refill during the ult (14 daggers × 6 = 84), so it fires once.
// Yone's Q is basic damage, not ability damage, so Galvanize ignores it. But Q applies on-hit
//   effects as a basic hit, so the full bar is used by Q's on-hit instead, the way an Energized
//   basic attack would (before Q's damage, at Q's 100% on-hit effectiveness).
// SIMPLIFICATION: in the game, Galvanize also fires the OTHER Energized items in the build
//   (unshrunk). We still let those proc on dagger 1's on-hit at R's %. Only matters for
//   Voltaic + Rapid Firecannon / Stormrazor; e.g. Stormrazor's 100 would be 35 instead of 100.
import type { EffectContext } from "../simulation/simulate.ts";
import { meleeWielder, type ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Voltaic_Cyclosword", patch: "26.23" },
  currentHealthDamage: 0.08,
  meleeLethality: 15,
  rangedCurrentHealthDamage: 0.06, // wiki: 8% melee, 6% ranged
  rangedLethality: 12, // wiki: 15 melee, 12 ranged
};

export const voltaicCyclosword: ItemPassive = {
  name: "Voltaic Cyclosword",
  source: data.source,
  createEffect: (wielder = meleeWielder) => {
    const ratio = wielder.ranged ? data.rangedCurrentHealthDamage : data.currentHealthDamage;
    const lethality = wielder.ranged ? data.rangedLethality : data.meleeLethality;
    let firedAt: number | undefined; // undefined = not fired yet
    function fire(context: EffectContext, effectiveness: number): void {
      firedAt = context.time; // set first: the damage below runs beforeDamage again
      context.dealDamage(ratio * context.target.hp * effectiveness, "physical");
    }
    return {
      name: "Voltaic Cyclosword",
      beforeDamage: (context, damage) => {
        if (firedAt !== undefined || !damage.abilityDamage) return;
        fire(context, 1);
      },
      onHit: (context) => {
        if (firedAt !== undefined || !context.basicDamage) return;
        fire(context, context.onHitEffectiveness);
      },
      shred: (time) =>
        firedAt !== undefined && time >= firedAt ? { armor: { flatPenetration: lethality } } : {},
    };
  },
};
