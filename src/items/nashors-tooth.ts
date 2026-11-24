// Nashor's Tooth, "Icathian Bite": 15 + 15% AP bonus magic damage on-hit.
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Nashor%27s_Tooth", patch: "26.23" },
  baseDamage: 15,
  apRatio: 0.15,
};

export const nashorsTooth: ItemPassive = {
  name: "Nashor's Tooth",
  source: data.source,
  createEffect: () => ({
    name: "Nashor's Tooth",
    onHit: (context) => {
      const damage = data.baseDamage + data.apRatio * context.attacker.ap;
      context.dealDamage(damage * context.onHitEffectiveness, "magic");
    },
  }),
};
