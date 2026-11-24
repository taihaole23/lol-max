// The champions the user can pick to build for (the attacker, not the dummy).
// Adding a champion = a data file like katarina.ts, an entry in `playableChampions` below, and the
// code that models the abilities (src/simulation/abilities.ts).
import { akali } from "./akali.ts";
import { katarina } from "./katarina.ts";
import { yone } from "./yone.ts";

// Every champion has these 4 ability keys.
export type AbilityKey = "q" | "w" | "e" | "r";

// The parts of a champion's data file that the shared code reads (stats, ranks, the page).
// Each data file also holds its own ability numbers (Katarina: deathLotus, shunpo...), which only
// that champion's ability code reads.
export type ChampionKit = {
  name: string;
  // Melee champions can't buy ranged-only items (Runaan's Hurricane), and the item pool assumes melee.
  rangeType: { source: { url: string; patch: string }; type: "melee" };
  baseStats: {
    source: { url: string; patch: string };
    health: { base: number; perLevel: number };
    armor: { base: number; perLevel: number };
    magicResist: { base: number; perLevel: number };
    attackDamage: { base: number; perLevel: number };
    attackSpeed: { base: number; bonusPerLevel: number };
    moveSpeed: number;
  };
  adaptiveType: { source: { url: string; patch: string }; whenTied: "ad" | "ap" };
  abilities: {
    source: { url: string; patch: string };
    list: readonly { key: AbilityKey; name: string; maxRank: number }[];
  };
  // The usual skill order (see ability-ranks.ts, recommendedRanks).
  skillOrder: { start: readonly AbilityKey[]; priority: readonly AbilityKey[] };
  // Only champions whose passive changes critical strikes (Yone). See championStats.
  critPassive?: {
    source: { url: string; patch: string };
    critChanceMultiplier: number; // item crit chance × this (then capped at 100%)
    bonusAdPerExcessCrit: number; // bonus AD per 100% crit chance over the cap
    critDamageModifier: number; // his crits deal this share of the usual crit damage
  };
};

// `satisfies` checks each entry has every ChampionKit field, without forgetting the exact
// numbers in the data files.
export const playableChampions = {
  katarina,
  akali,
  yone,
} satisfies Record<string, ChampionKit>;

// "katarina" | "akali" | "yone"
export type PlayableChampionId = keyof typeof playableChampions;

export const isPlayableChampion = (slug: string): slug is PlayableChampionId => slug in playableChampions;

// The abilities whose damage the site can work out for at least one champion, and what the type is
// called in the code. Which ones each champion has is in `modelledAbilities` (Yone's W deals damage,
// Katarina's and Akali's don't).
export const damageAbilities = ["q", "w", "e", "r"] as const;
export type DamageAbilityKey = (typeof damageAbilities)[number];

export const modelledAbilities: Record<PlayableChampionId, readonly DamageAbilityKey[]> = {
  katarina: ["q", "e", "r"],
  akali: ["q", "e", "r"],
  yone: ["q", "w", "r"],
};

// Abilities that deal no damage by themselves, with the reason the page shows instead of "coming soon".
export const noDamageAbilities: Record<PlayableChampionId, Partial<Record<AbilityKey, string>>> = {
  katarina: {
    w:
      "It only throws a dagger into the air and gives Katarina move speed. The damage comes later, from her " +
      "passive, when she picks the dagger up, and the site doesn't model daggers on the ground.",
  },
  akali: {
    w:
      "It only drops a shroud that makes Akali invisible and gives her energy and move speed. " +
      "Her passive's empowered attack isn't modelled either.",
  },
  yone: {
    e:
      "Soul Unbound deals no damage by itself. When it ends, it repeats part of the damage Yone dealt during " +
      "it, so its damage depends on a whole combo, and the site calculates one ability at a time.",
  },
};

export function isDamageAbility(key: AbilityKey): key is DamageAbilityKey {
  return (damageAbilities as readonly string[]).includes(key);
}

// True if the site calculates this champion's ability.
export function isModelled(champion: PlayableChampionId, key: AbilityKey): key is DamageAbilityKey {
  return isDamageAbility(key) && modelledAbilities[champion].includes(key);
}
