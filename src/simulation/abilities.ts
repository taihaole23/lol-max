// Which code builds the cast (AbilityCast) for each champion's abilities.
// Each champion has their own file (katarina-abilities.ts, akali-abilities.ts, yone-abilities.ts);
// this file only picks the right one.
import type { DamageAbilityKey, PlayableChampionId } from "../data/playable-champions.ts";
import { akaliCastFor, akaliDamageRule } from "./akali-abilities.ts";
import { katarinaCast, katarinaDamageRule } from "./katarina-abilities.ts";
import type { AbilityCast } from "./simulate.ts";
import { yoneCanCrit, yoneCast, yoneDamageRule } from "./yone-abilities.ts";

type ChampionAbilities = {
  // `crit`: build the cast as if it critically strikes (only for abilities where canCrit is true).
  cast: (ability: DamageAbilityKey, rank: number, crit: boolean) => AbilityCast;
  damageRule: (ability: DamageAbilityKey) => string; // the one-line rule under the damage total
  canCrit: (ability: DamageAbilityKey) => boolean;
};

const neverCrits = () => false;

// `Record<PlayableChampionId, ...>` means adding a champion to playable-champions.ts without an
// entry here is a type error, so it can't be forgotten.
const abilitiesOf: Record<PlayableChampionId, ChampionAbilities> = {
  katarina: { cast: katarinaCast, damageRule: katarinaDamageRule, canCrit: neverCrits },
  akali: { cast: akaliCastFor, damageRule: akaliDamageRule, canCrit: neverCrits },
  yone: { cast: yoneCast, damageRule: yoneDamageRule, canCrit: yoneCanCrit },
};

// The cast for any damaging ability. The rank must already be checked (checkAbilityRank).
export function abilityCast(champion: PlayableChampionId, ability: DamageAbilityKey, rank: number, crit = false): AbilityCast {
  return abilitiesOf[champion].cast(ability, rank, crit);
}

// True if the ability can critically strike (Yone's Q). Its damage is then the peak (a crit, if the build can crit).
export function abilityCanCrit(champion: PlayableChampionId, ability: DamageAbilityKey): boolean {
  return abilitiesOf[champion].canCrit(ability);
}

export function damageRule(champion: PlayableChampionId, ability: DamageAbilityKey): string {
  return abilitiesOf[champion].damageRule(ability);
}
