// Experimental Hexplate, "Overdrive": casting R gives +50% bonus attack speed and
// +20% bonus move speed for 8 seconds (melee numbers; Katarina is melee).
// R is cast at time 0, before any dagger, and 8 s is longer than the 2.5 s ult, so it's on
// for the whole ult. That makes it a plain stat passive, like Rod of Ages.
// - The attack speed raises R's AD part (its AD ratio grows with bonus attack speed).
// - The move speed only matters for Swiftmarch.
// "Hexcharged" (ultimate haste) doesn't change damage.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Experimental_Hexplate", patch: PATCH },
  meleeBonusAttackSpeed: 0.5,
  meleePercentMoveSpeed: 0.2,
};

export const experimentalHexplate: ItemPassive = {
  name: "Experimental Hexplate",
  stats: {
    step: "add",
    apply: (stats) => {
      stats.bonusAttackSpeed += data.meleeBonusAttackSpeed;
      stats.percentMoveSpeed += data.meleePercentMoveSpeed;
    },
  },
};
