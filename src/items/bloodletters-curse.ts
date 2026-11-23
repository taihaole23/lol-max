// Bloodletter's Curse, "Vile Decay": magic damage from a champion ability adds a stack
// (7.5% MR reduction each, up to 4 stacks = 30%). Stacks last 6 s, longer than the ult.
//
// The wiki says the stack goes on AFTER the hit, so the hit that adds a stack doesn't
// benefit from it. One dagger's magic damage is stored as two pieces (base + AP ratio),
// but it's one hit, so a dagger adds one stack: "same time" counts as "same hit".
//
// ASSUMPTION: on-hit damage from items (Nashor's, Wit's End...) is item damage, not
// ability damage, so it doesn't add stacks.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Bloodletter%27s_Curse", patch: PATCH },
  mrReductionPerStack: 0.075,
  maxStacks: 4,
};

export const bloodlettersCurse: ItemPassive = {
  name: "Bloodletter's Curse",
  source: data.source,
  createEffect: () => {
    const stackTimes: number[] = []; // when each stack was added

    return {
      name: "Bloodletter's Curse",
      afterDamage: (context, damage) => {
        if (damage.type !== "magic" || damage.fromItem) return;
        if (stackTimes.length >= data.maxStacks || stackTimes.includes(context.time)) return;
        stackTimes.push(context.time);
      },
      // Only stacks from earlier hits count.
      shred: (time) => {
        const stacks = stackTimes.filter((t) => t < time).length;
        return { magic: { percentReduction: stacks * data.mrReductionPerStack } };
      },
    };
  },
};
