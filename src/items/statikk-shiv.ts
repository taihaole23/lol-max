// Statikk Shiv, "Electrospark": the Energized attack makes chain lightning that deals 60 magic
// damage to the target (dagger 1, see energized.ts). It bounces to other enemies, but there's
// only one dummy, so it hits once.
// The wiki says Electrospark "is not affected by on-hit damage modifiers", so R's 25 / 30 / 35%
// does NOT shrink it. (To check in the Practice Tool.)
// "Electroshock" (+9 Energize per basic attack): see the assumption in energized.ts.
import { energizedEffect } from "./energized.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Statikk_Shiv", patch: "26.23" },
  damage: 60,
};

export const statikkShiv: ItemPassive = {
  name: "Statikk Shiv",
  source: data.source,
  createEffect: () => energizedEffect("Statikk Shiv", (context) => context.dealDamage(data.damage, "magic")),
};
