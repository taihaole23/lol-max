// Hexoptics C44, "Magnification": deal 1% more BASIC damage per 50 units of distance to the target,
// up to 10% (at 500 units). "The distance is calculated from the edge of your current position to
// edge of the target's position", the way attack range is measured.
//
// Melee champions stand right next to the dummy (0 units): 0%. Ranged champions stand at their attack
// range (550+): the full 10%. Only basic damage counts (Ezreal's Q, Yone's Q...), not ability or item
// damage (wiki: "not applied to effects that do not deal basic damage").
// "Arcane Aim" needs a takedown: the dummy never dies.
import { meleeWielder, type ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Hexoptics_C44", patch: "26.23" },
  ampPerUnit: 0.01 / 50,
  maxAmp: 0.1,
};

export const hexopticsC44: ItemPassive = {
  name: "Hexoptics C44",
  source: data.source,
  createEffect: (wielder = meleeWielder) => {
    const amp = Math.min(wielder.distance * data.ampPerUnit, data.maxAmp);
    return {
      name: "Hexoptics C44",
      damageMultiplier: (_context, damage) => (damage.basicDamage ? 1 + amp : 1),
    };
  },
};
