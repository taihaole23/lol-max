// Lich Bane, "Spellblade": 75% base AD + 45% AP bonus magic damage, first dagger only.
// (Its 50% attack speed is for a basic attack, so it doesn't matter here.)
import { PATCH } from "../data/patch.ts";
import { spellbladeEffect } from "./spellblade.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Lich_Bane", patch: PATCH },
  baseAdRatio: 0.75,
  apRatio: 0.45,
};

export const lichBane: ItemPassive = {
  name: "Lich Bane",
  source: data.source,
  createEffect: () =>
    spellbladeEffect("Lich Bane", "magic", (a) => data.baseAdRatio * a.baseAd + data.apRatio * a.ap),
};
