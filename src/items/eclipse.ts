// Eclipse, "Ever Rising Moon": applying 2 stacks to a champion within 2 s deals bonus physical
// damage equal to 8% (melee) of the target's MAXIMUM health (6 s cooldown, so once per cast).
// The shield doesn't matter.
//
// Stacks: "up to one per cast instance". So each HIT of the ability gives one stack (its pieces
// of damage, base + AP ratio..., are one hit):
//   - Katarina's R: the Death Lotus page says "each dagger counts as a separate hit for ... Eclipse".
//     Dagger 1 gives a stack, dagger 2 gives the second one and procs it.
//   - Akali's E: the first cast and the recast are 2 casts, so 2 stacks: the recast procs it.
//   - Akali's R: R1 and R2 are 2.5 s apart, more than 2 s, so it never procs.
//   - Garen's E: all its spins are one cast instance (one cast of one ability), so one stack and no
//     proc. ASSUMPTION: the wiki doesn't name Judgment; to check in the Practice Tool.
// It's not on-hit damage, so R's on-hit effectiveness doesn't shrink it.
// ASSUMPTION: only the ability's own hits give stacks here. (Item damage over time can too, per
//   the wiki, but "proc damage" can't, and most item damage is proc damage.)
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Eclipse", patch: "26.23" },
  daggerSource: { url: "https://wiki.leagueoflegends.com/en-us/Template:Data_Katarina/Death_Lotus", patch: "26.23" },
  stacksToProc: 2,
  stackWindowSeconds: 2,
  meleeMaxHealthDamage: 0.08,
};

export const eclipse: ItemPassive = {
  name: "Eclipse",
  source: data.source,
  createEffect: () => {
    const stacks: { castInstance: number; time: number }[] = [];
    let used = false;
    return {
      name: "Eclipse",
      afterDamage: (context, damage) => {
        if (used || damage.fromItem || damage.castInstance === undefined) return;
        if (stacks.some((s) => s.castInstance === damage.castInstance)) return; // this cast already gave its stack
        stacks.push({ castInstance: damage.castInstance, time: context.time });
        const recent = stacks.filter((s) => context.time - s.time <= data.stackWindowSeconds);
        if (recent.length < data.stacksToProc) return;
        used = true;
        context.dealDamage(data.meleeMaxHealthDamage * context.targetMaxHp, "physical");
      },
    };
  },
};
