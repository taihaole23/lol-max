// Unending Despair, "Anguish": every 4 s after entering combat with champions, sap enemy
// champions within 650 units for magic damage equal to 3% of your BONUS health. (The heal
// doesn't change damage.)
//
// Combat starts at time 0 (R cast, or the moment Q / E hits), so the first sap is at 4 s.
// That's after Katarina's 2.5 s ult and after the 3 s window of every one-hit ability, so it
// only counts for Akali's R: R2 lands at 2.5 s, and items count until 3 s after it (5.5 s).
// It's item damage, not ability damage, so it doesn't start Liandry's or Blackfire's burns.
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Unending_Despair", patch: "26.23" },
  secondsBetweenSaps: 4,
  bonusHealthRatio: 0.03,
};

export const unendingDespair: ItemPassive = {
  name: "Unending Despair",
  source: data.source,
  createEffect: () => ({
    name: "Unending Despair",
    onCast: (context) => {
      // Each sap schedules the next one; the simulation throws away any after the damage window.
      const sap: Parameters<typeof context.schedule>[1] = (later) => {
        const bonusHealth = later.attacker.health - later.attacker.baseHealth;
        later.dealDamage(data.bonusHealthRatio * bonusHealth, "magic");
        later.schedule(data.secondsBetweenSaps, sap);
      };
      context.schedule(data.secondsBetweenSaps, sap);
    },
  }),
};
