// Liandry's Torment.
// "Torment": ability damage burns the target: 1% of its MAXIMUM health as magic damage
//   every 0.5 s for 3 s. Every dagger refreshes the burn, so it keeps going all ult:
//   ticks at 0.5, 1.0, 1.5, 2.0 and 2.5 s (see ticking.ts for the first-tick assumption).
// "Suffering": for each second in combat, deal 2% more damage, up to 3 stacks (6%).
//   During the 2.5 s ult that's 0% → 2% at 1 s → 4% at 2 s. It boosts the burn too.
// Death Lotus BUG (listed on the wiki, so it's how the game really plays): R's on-hit
//   effectiveness (25 / 30 / 35%) also shrinks the burn, because a dagger started it.
import { PATCH } from "../data/patch.ts";
import { inCombatAmpEffect } from "./in-combat-amp.ts";
import { tickingEffect } from "./ticking.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Liandry%27s_Torment", patch: PATCH },
  bugSource: { url: "https://wiki.leagueoflegends.com/en-us/Template:Data_Katarina/Death_Lotus", patch: PATCH },
  burnMaxHealthPerTick: 0.01,
  burnSecondsBetweenTicks: 0.5,
  burnSeconds: 3,
  ampPerStack: 0.02,
  maxStacks: 3,
  secondsPerStack: 1,
};

export const liandrysTorment: ItemPassive = {
  name: "Liandry's Torment",
  source: data.source,
  createEffect: () => ({
    // One effect with both passives: the amp's damageMultiplier and the burn's afterDamage.
    ...inCombatAmpEffect("Liandry's Torment", data.ampPerStack, data.maxStacks, data.secondsPerStack),
    ...tickingEffect({
      name: "Liandry's Torment",
      secondsBetweenTicks: data.burnSecondsBetweenTicks,
      durationSeconds: data.burnSeconds,
      triggeredBy: (damage) => !damage.fromItem, // ability damage = R's own damage
      tick: (context) =>
        context.dealDamage(data.burnMaxHealthPerTick * context.targetMaxHp * context.onHitEffectiveness, "magic"),
    }),
  }),
};
