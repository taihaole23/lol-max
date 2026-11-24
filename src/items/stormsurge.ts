// Stormsurge.
// "Stormraider": dealing damage equal to 25% of the target's MAXIMUM health within 2.5 s
//   applies "Squall" (30 s cooldown, so once per ult).
// "Squall": 2 s after it's applied, lightning strikes for 125 + 10% AP magic damage.
//
// The whole ult is 2.5 s long, so all of its damage is always "within 2.5 s": we just add
// up everything dealt so far. To land inside the ult (channel window rule), Squall must be
// applied by 0.5 s (about the first 4 daggers), so it only matters with huge damage or a
// low-HP dummy.
// ASSUMPTION: the 25% counts damage after armor / MR ("damage dealt") from every source,
//   R's and items'. The strike uses Katarina's AP at the moment it lands.
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Stormsurge", patch: "26.23" },
  maxHealthToTrigger: 0.25,
  secondsUntilStrike: 2,
  strikeDamage: 125,
  strikeApRatio: 0.1,
};

export const stormsurge: ItemPassive = {
  name: "Stormsurge",
  source: data.source,
  createEffect: () => {
    let damageSoFar = 0;
    let applied = false;

    return {
      name: "Stormsurge",
      afterDamage: (context, _damage, amount) => {
        if (applied) return;
        damageSoFar += amount;
        if (damageSoFar < data.maxHealthToTrigger * context.targetMaxHp) return;
        applied = true;
        context.schedule(data.secondsUntilStrike, (later) =>
          later.dealDamage(data.strikeDamage + data.strikeApRatio * later.attacker.ap, "magic"),
        );
      },
    };
  },
};
