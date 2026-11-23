// Spear of Shojin, "Focused Will": ability damage gives a stack (up to 4), and each stack
// makes ability damage 3% bigger. One cast (one R) can only give one stack per second.
// The wiki says a hit doesn't benefit from the stack it gives: the first hit gets nothing.
// So during R: dagger 1 adds a stack at 0 s, the next at the first dagger 1 s later, and so on.
// ("Dragonforce", basic ability haste, doesn't change R's damage.)
//
// ASSUMPTION (to check in the Practice Tool): the bonus only applies to R's own damage,
// not to on-hit item damage the daggers apply. The wiki's "proc damage from your ability"
// is unclear about on-hit, and leaving it out is the safer guess.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Spear_of_Shojin", patch: PATCH },
  ampPerStack: 0.03,
  maxStacks: 4,
  secondsBetweenStacks: 1, // per cast instance
};

export const spearOfShojin: ItemPassive = {
  name: "Spear of Shojin",
  createEffect: () => {
    const stackTimes: number[] = [];

    return {
      name: "Spear of Shojin",
      // Only stacks from earlier hits count.
      damageMultiplier: (context, damage) => {
        if (damage.fromItem) return 1;
        const stacks = stackTimes.filter((t) => t < context.time).length;
        return 1 + stacks * data.ampPerStack;
      },
      afterDamage: (context, damage) => {
        if (damage.fromItem || stackTimes.length >= data.maxStacks) return;
        const last = stackTimes[stackTimes.length - 1];
        if (last === undefined || context.time >= last + data.secondsBetweenStacks) {
          stackTimes.push(context.time);
        }
      },
    };
  },
};
