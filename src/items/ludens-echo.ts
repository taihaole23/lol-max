// Luden's Echo, "Echo": the item holds 6 Echo stacks. Ability damage uses them all up:
// 75 + 5% AP magic damage to the target, and one more hit on another enemy for each stack
// beyond the first. With no other enemies, each leftover stack instead deals 20% of that
// damage to the target, one every 0.25 s (wiki notes).
//
// Stacks fill up on their own, so all 6 are ready at R cast (Eric's rule), and the first
// dagger uses them: 75 + 5% AP at 0 s, then 5 × (15 + 1% AP) at 0.25, 0.5, ... 1.25 s.
// ASSUMPTION: the stacks don't come back during the 2.5 s ult.
// Death Lotus BUG (listed on the wiki, so it's how the game really plays): R's on-hit
//   effectiveness (25 / 30 / 35%) also shrinks Luden's damage, because a dagger triggered it.
//   We apply it to the leftover-stack hits too, since they come from the same trigger.
//   (`procEffectiveness`: 1 for Q and E.)
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Luden%27s_Echo", patch: "26.23" },
  bugSource: { url: "https://wiki.leagueoflegends.com/en-us/Template:Data_Katarina/Death_Lotus", patch: "26.23" },
  stacks: 6,
  baseDamage: 75,
  apRatio: 0.05,
  leftoverStackShare: 0.2,
  secondsBetweenLeftoverHits: 0.25,
};

export const ludensEcho: ItemPassive = {
  name: "Luden's Echo",
  source: data.source,
  createEffect: () => {
    let used = false;
    return {
      name: "Luden's Echo",
      afterDamage: (context, damage) => {
        if (used || damage.fromItem) return;
        used = true; // set first: the damage below runs afterDamage again

        const fullHit = (ap: number) => (data.baseDamage + data.apRatio * ap) * context.procEffectiveness;
        context.dealDamage(fullHit(context.attacker.ap), "magic");

        const leftoverStacks = data.stacks - 1; // one enemy: no extra targets to fire at
        for (let i = 1; i <= leftoverStacks; i++) {
          context.schedule(i * data.secondsBetweenLeftoverHits, (later) => {
            later.dealDamage(data.leftoverStackShare * fullHit(later.attacker.ap), "magic");
          });
        }
      },
    };
  },
};
