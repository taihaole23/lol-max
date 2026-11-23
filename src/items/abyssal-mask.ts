// Abyssal Mask, "Unmake": enemy champions within 700 units take 12% more magic damage
// (after MR) from all sources. Katarina stands next to the dummy, so it's always on,
// and it boosts item magic damage too, not only R's.
import { PATCH } from "../data/patch.ts";
import type { ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Abyssal_Mask", patch: PATCH },
  magicDamageAmp: 0.12,
};

export const abyssalMask: ItemPassive = {
  name: "Abyssal Mask",
  createEffect: () => ({
    name: "Abyssal Mask",
    damageMultiplier: (_context, damage) => (damage.type === "magic" ? 1 + data.magicDamageAmp : 1),
  }),
};
