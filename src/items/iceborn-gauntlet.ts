// Iceborn Gauntlet, "Spellblade": 150% base AD bonus physical damage, first dagger only.
// The frost field only slows, so it doesn't matter.
import { spellbladeEffect } from "./spellblade.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Iceborn_Gauntlet", patch: "26.23" },
  baseAdRatio: 1.5,
};

export const icebornGauntlet: ItemPassive = {
  name: "Iceborn Gauntlet",
  source: data.source,
  createEffect: () => spellbladeEffect("Iceborn Gauntlet", "physical", (a) => data.baseAdRatio * a.baseAd),
};
