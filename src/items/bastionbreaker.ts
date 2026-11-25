// Bastionbreaker, "Shaped Charge": your next ability damage to a champion deals bonus
// true damage: 40 + 1.5 per lethality (melee values). Its cooldown is far longer than the
// ult, so only the first dagger gets it. It's not on-hit, so R's 25 / 30 / 35% doesn't apply.
// ("Sabotage" needs a takedown, and the dummy never dies.)
// Yone's Q is basic damage, not ability damage, so it doesn't trigger this (`damage.abilityDamage`).
import { meleeWielder, type ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Bastionbreaker", patch: "26.23" },
  baseDamage: 40,
  damagePerLethality: 1.5,
  rangedBaseDamage: 20, // wiki: 40 melee, 20 ranged
  rangedDamagePerLethality: 0.75, // wiki: 1.5 melee, 0.75 ranged
};

export const bastionbreaker: ItemPassive = {
  name: "Bastionbreaker",
  source: data.source,
  createEffect: (wielder = meleeWielder) => {
    let used = false;
    return {
      name: "Bastionbreaker",
      afterDamage: (context, damage) => {
        if (used || !damage.abilityDamage) return;
        used = true;
        // Lethality is Katarina's flat armor penetration.
        const lethality = context.attacker.armorShred.flatPenetration;
        const base = wielder.ranged ? data.rangedBaseDamage : data.baseDamage;
        const perLethality = wielder.ranged ? data.rangedDamagePerLethality : data.damagePerLethality;
        context.dealDamage(base + perLethality * lethality, "true");
      },
    };
  },
};
