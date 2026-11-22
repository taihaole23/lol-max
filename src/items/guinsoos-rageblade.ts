// Guinsoo's Rageblade, "Wrath": 30 bonus magic damage on-hit.
// "Seething Strike" (attack speed stacks and Phantom hits) comes in Step 5d-6.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Guinsoo%27s_Rageblade", patch: PATCH },
  wrathDamage: 30,
};

export const guinsoosRageblade: ItemPassive = {
  name: "Guinsoo's Rageblade",
  createEffect: () => ({
    name: "Guinsoo's Rageblade",
    onHit: (context) => context.dealDamage(data.wrathDamage * context.onHitEffectiveness, "magic"),
  }),
};
