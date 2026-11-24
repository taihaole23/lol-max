// Swiftmarch (tier-3 boots), "Noxian Fervor": adaptive force equal to 5% of total move speed.
// Adaptive force becomes bonus AD or AP, whichever of the two the champion has more of
// (item passives count, which is why this runs after the "convert" step).
//
// Move speed is read once, when R is cast. That includes Experimental Hexplate's +20%
// (it starts on R cast, in the "add" step). Move speed gained LATER in the ult (none of
// the modelled items give any) would not be counted.
import { adaptiveForce } from "../data/game-rules.ts";
import { totalMoveSpeed } from "../formulas/move-speed.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Swiftmarch", patch: "26.23" },
  adaptiveForceFromMoveSpeed: 0.05,
};

export const swiftmarch: ItemPassive = {
  name: "Swiftmarch",
  source: data.source,
  stats: {
    step: "adaptive",
    apply: (stats, context) => {
      const speed = totalMoveSpeed(stats.flatMoveSpeed, stats.percentMoveSpeed);
      const points = data.adaptiveForceFromMoveSpeed * speed;

      const givesAd =
        stats.bonusAd > stats.ap || (stats.bonusAd === stats.ap && context.adaptiveWhenTied === "ad");
      if (givesAd) stats.bonusAd += points * adaptiveForce.adPerPoint;
      else stats.ap += points * adaptiveForce.apPerPoint;
    },
  },
};
