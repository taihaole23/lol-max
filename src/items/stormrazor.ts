// Stormrazor, "Bolt": the Energized attack deals 100 bonus magic damage on-hit (dagger 1, see
// energized.ts). On-hit, so it's shrunk by R's 25 / 30 / 35%. The move speed doesn't matter
// (Swiftmarch is boots, and Stormrazor's speed comes after R is cast).
import { PATCH } from "../data/patch.ts";
import { energizedEffect } from "./energized.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Stormrazor", patch: PATCH },
  damage: 100,
};

export const stormrazor: ItemPassive = {
  name: "Stormrazor",
  source: data.source,
  createEffect: () =>
    energizedEffect("Stormrazor", (context) => context.dealDamage(data.damage * context.onHitEffectiveness, "magic")),
};
