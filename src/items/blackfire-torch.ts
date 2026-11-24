// Blackfire Torch.
// "Baleful Blaze": ability damage burns the target: 10 + 1% AP magic damage every 0.5 s
//   for 3 s. Every dagger refreshes it, like Liandry's burn: ticks at 0, 0.5, 1.0 ... 2.5 s.
//   (The first tick lands with the triggering hit: measured for Liandry's in the Practice Tool,
//   and the wiki mentions it for Blackfire too. See ticking.ts.)
//   The 0 s tick comes before the +4% AP below, so only the later ticks get it.
// "Blackfire": +4% AP while the target burns. The burn lasts 3 s and every dagger refreshes
//   it, so once dagger 1 starts it, it never ends during the ult.
//   The 4% ADDS to other % AP (Rabadon's 30% + 4% = 34%), per the wiki.
// Death Lotus BUG (listed on the wiki, so it's how the game really plays): R's on-hit
//   effectiveness (25 / 30 / 35%) also shrinks the burn, because a dagger started it.
//   (`procEffectiveness`: 1 for Q and E, so their burns are full size.)
//
// Dagger 1 starts the burn, so dagger 1 itself doesn't get the 4% ("same time = same hit",
// see NOTES.md). The AP goes up right after dagger 1 finishes, so dagger 2 onward,
// the burn ticks and other AP-based item damage all get it.
// Yone's Q is basic damage, not ability damage, so it doesn't trigger this (`damage.abilityDamage`).
import { addApPercent } from "../stats/ap-percent.ts";
import { tickingEffect } from "./ticking.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Blackfire_Torch", patch: "26.23" },
  bugSource: { url: "https://wiki.leagueoflegends.com/en-us/Template:Data_Katarina/Death_Lotus", patch: "26.23" },
  burnDamagePerTick: 10,
  burnApRatioPerTick: 0.01,
  burnSecondsBetweenTicks: 0.5,
  burnSeconds: 3,
  apIncreaseWhileBurning: 0.04,
};

export const blackfireTorch: ItemPassive = {
  name: "Blackfire Torch",
  source: data.source,
  createEffect: () => {
    const burn = tickingEffect({
      name: "Blackfire Torch",
      secondsBetweenTicks: data.burnSecondsBetweenTicks,
      durationSeconds: data.burnSeconds,
      triggeredBy: (damage) => damage.abilityDamage,
      tick: (context) => {
        const damage = data.burnDamagePerTick + data.burnApRatioPerTick * context.attacker.ap;
        context.dealDamage(damage * context.procEffectiveness, "magic");
      },
    });
    let apIncreased = false;

    return {
      name: "Blackfire Torch",
      afterDamage: (context, damage, amount) => {
        burn.afterDamage!(context, damage, amount);
        if (apIncreased || !damage.abilityDamage) return;
        apIncreased = true;
        // A 0-second delay runs it after everything else happening at this moment (the rest of dagger 1).
        context.schedule(0, (later) => addApPercent(later.attacker, data.apIncreaseWhileBurning));
      },
    };
  },
};
