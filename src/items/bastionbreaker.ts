// Bastionbreaker, "Shaped Charge": your next ability damage to a champion deals bonus
// true damage: 40 + 1.5 per lethality (melee values). Its cooldown is far longer than the
// ult, so only the first dagger gets it. It's not on-hit, so R's 25 / 30 / 35% doesn't apply.
// ("Sabotage" needs a takedown, and the dummy never dies.)
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Bastionbreaker", patch: "26.23" },
  baseDamage: 40,
  damagePerLethality: 1.5,
};

export const bastionbreaker: ItemPassive = {
  name: "Bastionbreaker",
  source: data.source,
  createEffect: () => {
    let used = false;
    return {
      name: "Bastionbreaker",
      afterDamage: (context, damage) => {
        if (used || damage.fromItem) return;
        used = true;
        // Lethality is Katarina's flat armor penetration.
        const lethality = context.attacker.armorShred.flatPenetration;
        context.dealDamage(data.baseDamage + data.damagePerLethality * lethality, "true");
      },
    };
  },
};
