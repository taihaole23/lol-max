// Rod of Ages, "Timeless". Our rules say stacks that grow on their own are full when R starts,
// so it always has its 10 stacks: +100 bonus health, +30 AP, and one extra level (never past 18).
// The mana does nothing: Katarina has no mana. "Eternity" (mana / healing) doesn't affect damage.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Rod_of_Ages", patch: PATCH },
  healthAtFullStacks: 100,
  apAtFullStacks: 30,
  levelsAtFullStacks: 1,
};

export const rodOfAges: ItemPassive = {
  name: "Rod of Ages",
  source: data.source,
  extraLevels: data.levelsAtFullStacks,
  stats: {
    step: "add",
    apply: (stats) => {
      stats.health += data.healthAtFullStacks;
      stats.ap += data.apAtFullStacks;
    },
  },
};
