// Voltaic Cyclosword. An Energized item (bar full at R cast, see energized.ts).
// "Galvanize": dealing ABILITY damage to a champion triggers the Energized attack's effects.
//   So R's first damage triggers it, not dagger 1's on-hit. It's not on-hit damage, so R's
//   25 / 30 / 35% doesn't shrink it. The wiki says its damage lands BEFORE the triggering damage.
// "Firmament": deals bonus physical damage equal to 8% of the dummy's CURRENT health, and gives
//   +15 lethality for 4 s, granted before its own damage. 4 s is longer than the ult, so every
//   physical hit from then on gets it (lethality = flat armor pen, 1 for 1).
// The bar can't refill during the ult (14 daggers × 6 = 84), so it fires once.
// SIMPLIFICATION: in the game, Galvanize also fires the OTHER Energized items in the build
//   (unshrunk). We still let those proc on dagger 1's on-hit at R's %. Only matters for
//   Voltaic + Rapid Firecannon / Stormrazor; e.g. Stormrazor's 100 would be 35 instead of 100.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Voltaic_Cyclosword", patch: PATCH },
  currentHealthDamage: 0.08,
  meleeLethality: 15,
};

export const voltaicCyclosword: ItemPassive = {
  name: "Voltaic Cyclosword",
  createEffect: () => {
    let firedAt: number | undefined; // undefined = not fired yet
    return {
      name: "Voltaic Cyclosword",
      beforeDamage: (context, damage) => {
        if (firedAt !== undefined || damage.fromItem) return;
        firedAt = context.time; // set first: the damage below runs beforeDamage again
        context.dealDamage(data.currentHealthDamage * context.target.hp, "physical");
      },
      shred: (time) =>
        firedAt !== undefined && time >= firedAt ? { armor: { flatPenetration: data.meleeLethality } } : {},
    };
  },
};
