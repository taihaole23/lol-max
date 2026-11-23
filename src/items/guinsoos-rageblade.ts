// Guinsoo's Rageblade.
// "Wrath": 30 bonus magic damage on-hit.
// "Seething Strike": each attack (on-attack) gives +8% bonus attack speed, up to 4 stacks.
//   Once all 4 are up, each attack gives a Phantom stack, up to 2. At 2 Phantom stacks, the next
//   attack uses them to make a Phantom Hit: every on-hit effect applies once more, 0.15 s later.
//   Daggers count as attacks (Eric, from playing; a hidden note on the wiki page agrees).
//
// Over one ult: daggers 1-4 give attack speed (each counts from the NEXT dagger, see simulate.ts),
// daggers 5-6 give Phantom stacks, dagger 7 makes a Phantom Hit; then 8-9 stack, 10 hits;
// 11-12 stack, 13 hits; 14-15 stack. So 3 Phantom Hits. (A patch 26.14 note confirms the first
// Phantom Hit comes on the 7th attack.) All stacks last 4 s, longer than the ult.
// ASSUMPTION (to check in the Practice Tool): the Phantom Hit's on-hit effects are shrunk by
//   R's 25 / 30 / 35% like a normal dagger's. Old wiki text said "100% effectiveness"; the
//   current text doesn't say. We picked the lower guess.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Guinsoo%27s_Rageblade", patch: PATCH },
  wrathDamage: 30,
  attackSpeedPerStack: 0.08,
  maxAttackSpeedStacks: 4,
  phantomStacksForHit: 2,
  phantomHitDelaySeconds: 0.15,
};

export const guinsoosRageblade: ItemPassive = {
  name: "Guinsoo's Rageblade",
  source: data.source,
  createEffect: () => {
    let attackSpeedStacks = 0;
    let phantomStacks = 0;
    return {
      name: "Guinsoo's Rageblade",
      onAttack: (context) => {
        if (attackSpeedStacks < data.maxAttackSpeedStacks) {
          attackSpeedStacks++;
          context.attacker.bonusAttackSpeed += data.attackSpeedPerStack;
        } else if (phantomStacks < data.phantomStacksForHit) {
          phantomStacks++;
        } else {
          phantomStacks = 0;
          context.schedule(data.phantomHitDelaySeconds, (later) => later.applyOnHitEffects());
        }
      },
      onHit: (context) => context.dealDamage(data.wrathDamage * context.onHitEffectiveness, "magic"),
    };
  },
};
