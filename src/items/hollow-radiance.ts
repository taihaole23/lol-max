// Hollow Radiance, "Immolate": 15 + 1% bonus health magic damage every second (see immolate.ts).
// "Desolate" needs a kill, and the dummy never dies, so it never happens.
import { immolateEffect } from "./immolate.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Hollow_Radiance", patch: "26.23" },
  baseDamage: 15,
  bonusHealthRatio: 0.01,
};

export const hollowRadiance: ItemPassive = {
  name: "Hollow Radiance",
  source: data.source,
  createEffect: () => immolateEffect("Hollow Radiance", data.baseDamage, data.bonusHealthRatio),
};
