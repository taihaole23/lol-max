// Dead Man's Plate, "Shipwrecker": Momentum stacks build while walking, up to 100. An attack
// uses them all to deal 40 + 100% base AD bonus physical damage on-hit (at 100 stacks).
// Momentum fills up on its own, so it's full at R cast (Eric's rule), and dagger 1 uses it.
// Katarina doesn't move while channeling, so it never refills during the ult.
// The damage is on-hit, so it's shrunk by R's 25 / 30 / 35%.
// ASSUMPTION (to check in the Practice Tool): daggers use up Momentum like a basic attack,
//   the same way they trigger Energized items (Eric, from playing).
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Dead_Man%27s_Plate", patch: "26.23" },
  fullMomentumDamage: 40,
  fullMomentumBaseAdRatio: 1,
};

export const deadMansPlate: ItemPassive = {
  name: "Dead Man's Plate",
  source: data.source,
  createEffect: () => {
    let used = false;
    return {
      name: "Dead Man's Plate",
      onHit: (context) => {
        if (used) return;
        used = true;
        const damage = data.fullMomentumDamage + data.fullMomentumBaseAdRatio * context.attacker.baseAd;
        context.dealDamage(damage * context.onHitEffectiveness, "physical");
      },
    };
  },
};
