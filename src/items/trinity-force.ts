// Trinity Force, "Spellblade": 200% base AD bonus physical damage, first dagger only.
// "Quicken" (move speed) doesn't matter.
import { PATCH } from "../data/patch.ts";
import { spellbladeEffect } from "./spellblade.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Trinity_Force", patch: PATCH },
  baseAdRatio: 2,
};

export const trinityForce: ItemPassive = {
  name: "Trinity Force",
  createEffect: () => spellbladeEffect("Trinity Force", "physical", (a) => data.baseAdRatio * a.baseAd),
};
