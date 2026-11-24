// The champions the user can pick to build for (the attacker, not the dummy).
// Only Katarina in version 1. Adding a champion later = adding an entry here,
// plus the code that models her abilities.
import { katarina } from "./katarina.ts";

export const playableChampions = {
  katarina: { name: katarina.name, abilities: katarina.abilities.list },
} as const;

// "katarina"
export type PlayableChampionId = keyof typeof playableChampions;

// "q" | "w" | "e" | "r"
export type AbilityKey = (typeof katarina.abilities.list)[number]["key"];

// The abilities whose damage the site can work out, and what the type is called in the code.
export const damageAbilities = ["q", "e", "r"] as const;
export type DamageAbilityKey = (typeof damageAbilities)[number];

export const modelledAbilities: Record<PlayableChampionId, readonly DamageAbilityKey[]> = {
  katarina: damageAbilities,
};

// Abilities that deal no damage by themselves (Katarina's W only drops a dagger). Their page says so
// instead of "coming soon".
export const noDamageAbilities: Record<PlayableChampionId, readonly AbilityKey[]> = {
  katarina: ["w"],
};

export function isDamageAbility(key: AbilityKey): key is DamageAbilityKey {
  return (damageAbilities as readonly string[]).includes(key);
}
