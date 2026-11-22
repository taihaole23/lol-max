// Essence Reaver, "Spellblade": 125% base AD + 0.5 damage per 1% crit chance,
// bonus physical damage, first dagger only. (The mana it restores does nothing for Katarina.)
import { PATCH } from "../data/patch.ts";
import { spellbladeEffect } from "./spellblade.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Essence_Reaver", patch: PATCH },
  baseAdRatio: 1.25,
  // 0.5 damage per 1% crit chance = 50 damage per 100% (crit chance is stored as a fraction).
  damagePerCritChance: 50,
};

export const essenceReaver: ItemPassive = {
  name: "Essence Reaver",
  createEffect: () =>
    spellbladeEffect(
      "Essence Reaver",
      "physical",
      (a) => data.baseAdRatio * a.baseAd + data.damagePerCritChance * a.critChance,
    ),
};
