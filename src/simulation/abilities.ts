// Which code builds the cast (AbilityCast) for each champion's abilities.
// Each champion has their own file (katarina-abilities.ts, akali-abilities.ts); this file only picks the right one.
import type { DamageAbilityKey, PlayableChampionId } from "../data/playable-champions.ts";
import { akaliCastFor, akaliDamageRule } from "./akali-abilities.ts";
import { katarinaCast, katarinaDamageRule } from "./katarina-abilities.ts";
import type { AbilityCast } from "./simulate.ts";

type ChampionAbilities = {
  cast: (ability: DamageAbilityKey, rank: number) => AbilityCast;
  damageRule: (ability: DamageAbilityKey) => string; // the one-line rule under the damage total
};

// `Record<PlayableChampionId, ...>` means adding a champion to playable-champions.ts without an
// entry here is a type error, so it can't be forgotten.
const abilitiesOf: Record<PlayableChampionId, ChampionAbilities> = {
  katarina: { cast: katarinaCast, damageRule: katarinaDamageRule },
  akali: { cast: akaliCastFor, damageRule: akaliDamageRule },
};

// The cast for any damaging ability. The rank must already be checked (checkAbilityRank).
export function abilityCast(champion: PlayableChampionId, ability: DamageAbilityKey, rank: number): AbilityCast {
  return abilitiesOf[champion].cast(ability, rank);
}

export function damageRule(champion: PlayableChampionId, ability: DamageAbilityKey): string {
  return abilitiesOf[champion].damageRule(ability);
}
