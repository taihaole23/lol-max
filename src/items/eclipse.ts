// Eclipse, "Ever Rising Moon": applying 2 stacks to a champion within 2 s deals bonus physical
// damage equal to 8% (melee) of the target's MAXIMUM health (6 s cooldown, so once per ult).
// The shield doesn't matter.
//
// Normally it's one stack per cast instance, and the whole ult is one cast. But the Death Lotus
// page says "each dagger counts as a separate hit for ... Eclipse". So dagger 1 gives a stack,
// and dagger 2 gives the second one and procs it.
// It's not on-hit damage, so R's on-hit effectiveness doesn't shrink it.
// ASSUMPTION: only R's own daggers give stacks here. (Item damage can too, per the wiki, but
//   with daggers every 0.166 s, dagger 2 comes before anything else could matter.)
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Eclipse", patch: PATCH },
  daggerSource: { url: "https://wiki.leagueoflegends.com/en-us/Template:Data_Katarina/Death_Lotus", patch: PATCH },
  stacksToProc: 2,
  meleeMaxHealthDamage: 0.08,
};

export const eclipse: ItemPassive = {
  name: "Eclipse",
  createEffect: () => {
    const stackTimes: number[] = [];
    let used = false;
    return {
      name: "Eclipse",
      afterDamage: (context, damage) => {
        if (used || damage.fromItem) return;
        // One stack per dagger: a dagger's pieces all share its time ("same time = same hit").
        if (stackTimes.includes(context.time)) return;
        stackTimes.push(context.time);
        if (stackTimes.length < data.stacksToProc) return;
        used = true;
        context.dealDamage(data.meleeMaxHealthDamage * context.targetMaxHp, "physical");
      },
    };
  },
};
