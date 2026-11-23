// Liandry's Torment.
// "Suffering": for each second in combat, deal 2% more damage, up to 3 stacks (6%).
//   During the 2.5 s ult that's 0% → 2% at 1 s → 4% at 2 s.
// "Torment" (the burn) comes in Step 5d-5.
import { PATCH } from "../data/patch.ts";
import { inCombatAmpEffect } from "./in-combat-amp.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Liandry%27s_Torment", patch: PATCH },
  ampPerStack: 0.02,
  maxStacks: 3,
  secondsPerStack: 1,
};

export const liandrysTorment: ItemPassive = {
  name: "Liandry's Torment",
  createEffect: () => inCombatAmpEffect("Liandry's Torment", data.ampPerStack, data.maxStacks, data.secondsPerStack),
};
