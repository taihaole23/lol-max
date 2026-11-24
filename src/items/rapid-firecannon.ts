// Rapid Firecannon, "Sharpshooter": the Energized attack deals 40 bonus magic damage on-hit
// (dagger 1, see energized.ts). On-hit, so it's shrunk by R's 25 / 30 / 35%.
// The extra attack range doesn't matter.
import { energizedEffect } from "./energized.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Rapid_Firecannon", patch: "26.23" },
  damage: 40,
};

export const rapidFirecannon: ItemPassive = {
  name: "Rapid Firecannon",
  source: data.source,
  createEffect: () =>
    energizedEffect("Rapid Firecannon", (context) =>
      context.dealDamage(data.damage * context.onHitEffectiveness, "magic"),
    ),
};
