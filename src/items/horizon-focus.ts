// Horizon Focus, "Hypershot": dealing ability damage to a champion with an ability from 600 or more
// units away (centred range: "cr", measured from the cast position to where the target was hit)
// marks them for 6 s, and you deal 10% more damage to them. "The ability which triggered Hypershot
// also benefits from the damage increase" (wiki notes). 6 s is longer than every damage window.
//
// Melee champions stand right next to the dummy (65 + 65 = 130 units centre to centre): never.
// Ranged champions at their attack range are 550 + 130 = 680 units away or more: always, from their
// first ability hit. Item damage doesn't trigger it, but once marked, it's boosted too ("your damage").
// "Focus" (sight around the target) doesn't change damage.
import { championSize } from "../data/game-rules.ts";
import { meleeWielder, type ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Horizon_Focus", patch: "26.23" },
  minimumDistance: 600,
  damageAmp: 0.1,
};

export const horizonFocus: ItemPassive = {
  name: "Horizon Focus",
  source: data.source,
  createEffect: (wielder = meleeWielder) => {
    const farEnough = wielder.distance + 2 * championSize.gameplayRadius >= data.minimumDistance;
    let marked = false;
    return {
      name: "Horizon Focus",
      // Runs before the damage is worked out, so the triggering hit is already boosted.
      beforeDamage: (_context, damage) => {
        if (farEnough && damage.abilityDamage) marked = true;
      },
      damageMultiplier: () => (marked ? 1 + data.damageAmp : 1),
    };
  },
};
