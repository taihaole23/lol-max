// Experimental Hexplate, "Overdrive": casting R gives +50% bonus attack speed and
// +20% bonus move speed for 8 seconds (melee numbers; Katarina is melee).
// R is cast at time 0, before any dagger, and 8 s is longer than the 2.5 s ult, so it's on
// for the whole ult. That makes it a plain stat passive, like Rod of Ages.
// - The attack speed raises R's AD part (its AD ratio grows with bonus attack speed).
// - The move speed only matters for Swiftmarch.
// "Hexcharged" (ultimate haste) doesn't change damage.
// For Q and E there's no R cast, so Overdrive is off (only the item's plain stats count).
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Experimental_Hexplate", patch: "26.23" },
  meleeBonusAttackSpeed: 0.5,
  meleePercentMoveSpeed: 0.2,
  rangedBonusAttackSpeed: 0.25, // wiki: 50% melee, 25% ranged
  rangedPercentMoveSpeed: 0.1, // wiki: 20% melee, 10% ranged
};

export const experimentalHexplate: ItemPassive = {
  name: "Experimental Hexplate",
  source: data.source,
  stats: {
    step: "add",
    apply: (stats, context) => {
      if (context.ability !== "r") return;
      stats.bonusAttackSpeed += context.ranged ? data.rangedBonusAttackSpeed : data.meleeBonusAttackSpeed;
      stats.percentMoveSpeed += context.ranged ? data.rangedPercentMoveSpeed : data.meleePercentMoveSpeed;
    },
  },
};
