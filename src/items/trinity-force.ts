// Trinity Force, "Spellblade": 200% base AD bonus physical damage, first dagger only.
// "Quicken" (move speed) doesn't matter.
import { spellbladeEffect } from "./spellblade.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Trinity_Force", patch: "26.23" },
  baseAdRatio: 2,
};

export const trinityForce: ItemPassive = {
  name: "Trinity Force",
  source: data.source,
  createEffect: () => spellbladeEffect("Trinity Force", "physical", (a) => data.baseAdRatio * a.baseAd),
};
