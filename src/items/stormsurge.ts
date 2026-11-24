// Stormsurge.
// "Stormraider": dealing damage equal to 25% of the target's MAXIMUM health within 2.5 s
//   applies "Squall" (30 s cooldown, so once per cast).
// "Squall": 2 s after it's applied, lightning strikes for 125 + 10% AP magic damage.
//
// "Within 2.5 s" is a rolling window: after each piece of damage we add up everything dealt in
// the 2.5 s up to and including now. (Katarina's whole ult is 2.5 s long, so for her it's simply
// everything so far. Akali's R1 and R2 are exactly 2.5 s apart, so both count together.)
// To land inside Katarina's ult (channel window rule), Squall must be applied by 0.5 s (about the
// first 4 daggers), so it only matters with huge damage or a low-HP dummy.
// ASSUMPTION: the 25% counts damage after armor / MR ("damage dealt") from every source,
//   the ability's and items'. The strike uses the champion's AP at the moment it lands.
// ASSUMPTION: the window includes damage exactly 2.5 s ago (the wiki doesn't say).
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Stormsurge", patch: "26.23" },
  maxHealthToTrigger: 0.25,
  windowSeconds: 2.5,
  secondsUntilStrike: 2,
  strikeDamage: 125,
  strikeApRatio: 0.1,
};

export const stormsurge: ItemPassive = {
  name: "Stormsurge",
  source: data.source,
  createEffect: () => {
    const dealt: { time: number; amount: number }[] = [];
    let applied = false;

    return {
      name: "Stormsurge",
      afterDamage: (context, _damage, amount) => {
        if (applied) return;
        dealt.push({ time: context.time, amount });
        let inWindow = 0;
        for (const d of dealt) if (context.time - d.time <= data.windowSeconds) inWindow += d.amount;
        if (inWindow < data.maxHealthToTrigger * context.targetMaxHp) return;
        applied = true;
        context.schedule(data.secondsUntilStrike, (later) =>
          later.dealDamage(data.strikeDamage + data.strikeApRatio * later.attacker.ap, "magic"),
        );
      },
    };
  },
};
