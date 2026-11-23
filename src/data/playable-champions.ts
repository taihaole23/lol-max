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

// The abilities whose damage the site can work out. Version 1: Katarina's R only.
export const modelledAbilities: Record<PlayableChampionId, AbilityKey[]> = {
  katarina: ["r"],
};
