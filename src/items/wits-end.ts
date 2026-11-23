// Wit's End, "Fray": 45 bonus magic damage on-hit.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Wit%27s_End", patch: PATCH },
  damage: 45,
};

export const witsEnd: ItemPassive = {
  name: "Wit's End",
  source: data.source,
  createEffect: () => ({
    name: "Wit's End",
    onHit: (context) => context.dealDamage(data.damage * context.onHitEffectiveness, "magic"),
  }),
};
