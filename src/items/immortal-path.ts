// Immortal Path (tier-3 boots), "Now and Forever": deal 4% more damage while above 50% of
// your max health. The dummy never hits back, so Katarina is always at full health.
// (The healing part, below 50% health, never happens.)
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Immortal_Path", patch: PATCH },
  damageAmp: 0.04,
};

export const immortalPath: ItemPassive = {
  name: "Immortal Path",
  source: data.source,
  createEffect: () => ({
    name: "Immortal Path",
    damageMultiplier: () => 1 + data.damageAmp,
  }),
};
