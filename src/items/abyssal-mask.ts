// Abyssal Mask, "Unmake": enemy champions within 700 units (centre to edge) take 12% more magic
// damage (after MR) from all sources. Melee champions stand next to the dummy, so it's always on,
// and it boosts item magic damage too, not only the ability's. Ranged champions stand at their attack
// range: in at 550 (550 + 65 = 615 ≤ 700), out at Caitlyn's 650 (715 > 700).
import { insideAura, meleeWielder, type ItemPassive } from "./types.ts";

const data = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Abyssal_Mask", patch: "26.23" },
  magicDamageAmp: 0.12,
  radius: 700,
};

export const abyssalMask: ItemPassive = {
  name: "Abyssal Mask",
  source: data.source,
  createEffect: (wielder = meleeWielder) => ({
    name: "Abyssal Mask",
    damageMultiplier: !insideAura(wielder, data.radius, "centre-to-edge") ? undefined : (_context, damage) => (damage.type === "magic" ? 1 + data.magicDamageAmp : 1),
  }),
};
