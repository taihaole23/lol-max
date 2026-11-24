// Black Cleaver, "Carve": dealing physical damage adds a stack (6% armor reduction each,
// up to 5 stacks = 30%). Stacks last 6 s, longer than the ult, so they never fall off here.
//
// Two wiki notes that matter for Death Lotus:
// - Ability damage (a non-basic hit) adds its stack BEFORE its damage is worked out, so it
//   benefits from its own stack. The wiki lists this as a bug, but it's how the game works.
//   On-hit damage only benefits from earlier stacks.
// - Non-basic damage adds at most one stack per frame. We treat "same time" as "same frame",
//   so each dagger adds one stack, however many physical pieces it has.
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Black_Cleaver", patch: "26.23" },
  armorReductionPerStack: 0.06,
  maxStacks: 5,
};

export const blackCleaver: ItemPassive = {
  name: "Black Cleaver",
  source: data.source,
  createEffect: () => {
    let stacks = 0;
    let lastStackTime: number | undefined;

    function addStack(time: number): void {
      if (time === lastStackTime) return; // one stack per frame
      lastStackTime = time;
      stacks = Math.min(stacks + 1, data.maxStacks);
    }

    return {
      name: "Black Cleaver",
      // R's physical damage: the stack goes on first, so this hit already benefits.
      beforeDamage: (context, damage) => {
        if (damage.type === "physical" && !damage.fromItem) addStack(context.time);
      },
      // Item (on-hit) physical damage: the stack goes on after the hit.
      afterDamage: (context, damage) => {
        if (damage.type === "physical" && damage.fromItem) addStack(context.time);
      },
      shred: () => ({ armor: { percentReduction: stacks * data.armorReductionPerStack } }),
    };
  },
};
