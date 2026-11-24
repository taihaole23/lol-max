// Sunfire Aegis, "Immolate": 20 + 1.5% bonus health magic damage every second (see immolate.ts).
import { immolateEffect } from "./immolate.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Sunfire_Aegis", patch: "26.23" },
  baseDamage: 20,
  bonusHealthRatio: 0.015,
};

export const sunfireAegis: ItemPassive = {
  name: "Sunfire Aegis",
  source: data.source,
  createEffect: () => immolateEffect("Sunfire Aegis", data.baseDamage, data.bonusHealthRatio),
};
