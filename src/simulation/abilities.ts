// Which code builds the cast (AbilityCast) for each champion's abilities.
// Each champion has their own file (katarina-abilities.ts, akali-abilities.ts, yone-abilities.ts,
// garen-abilities.ts); this file only picks the right one.
import type { DamageAbilityKey, PlayableChampionId } from "../data/playable-champions.ts";
import { akaliCastFor, akaliDamageRule } from "./akali-abilities.ts";
import { garenCanCrit, garenCast, garenDamageRule, garenIsBasicAttack } from "./garen-abilities.ts";
import { katarinaCast, katarinaDamageRule } from "./katarina-abilities.ts";
import type { AbilityCast, Attacker } from "./simulate.ts";
import { yoneCanCrit, yoneCast, yoneDamageRule } from "./yone-abilities.ts";

type ChampionAbilities = {
  // `crit`: build the cast as if it critically strikes (only for abilities where canCrit is true).
  // `attacker`: the champion's stats when they cast (Garen's E spins more with more attack speed).
  cast: (ability: DamageAbilityKey, rank: number, crit: boolean, attacker: Attacker) => AbilityCast;
  damageRule: (ability: DamageAbilityKey) => string; // the one-line rule under the damage total
  canCrit: (ability: DamageAbilityKey) => boolean;
  // True if the ability IS a basic attack (Garen's Q), not just basic damage (Yone's Q).
  // Sundered Sky only empowers real basic attacks.
  isBasicAttack: (ability: DamageAbilityKey) => boolean;
};

const never = () => false;

// `Record<PlayableChampionId, ...>` means adding a champion to playable-champions.ts without an
// entry here is a type error, so it can't be forgotten.
const abilitiesOf: Record<PlayableChampionId, ChampionAbilities> = {
  katarina: { cast: katarinaCast, damageRule: katarinaDamageRule, canCrit: never, isBasicAttack: never },
  akali: { cast: akaliCastFor, damageRule: akaliDamageRule, canCrit: never, isBasicAttack: never },
  yone: { cast: yoneCast, damageRule: yoneDamageRule, canCrit: yoneCanCrit, isBasicAttack: never },
  garen: { cast: garenCast, damageRule: garenDamageRule, canCrit: garenCanCrit, isBasicAttack: garenIsBasicAttack },
};

// The cast for any damaging ability. The rank must already be checked (checkAbilityRank).
export function abilityCast(
  champion: PlayableChampionId,
  ability: DamageAbilityKey,
  rank: number,
  crit: boolean,
  attacker: Attacker,
): AbilityCast {
  return abilitiesOf[champion].cast(ability, rank, crit, attacker);
}

// True if the ability can critically strike (Yone's Q). Its damage is then the peak (a crit, if the build can crit).
export function abilityCanCrit(champion: PlayableChampionId, ability: DamageAbilityKey): boolean {
  return abilitiesOf[champion].canCrit(ability);
}

// True if the ability is a real basic attack (Garen's Q). Sundered Sky makes it crit.
export function abilityIsBasicAttack(champion: PlayableChampionId, ability: DamageAbilityKey): boolean {
  return abilitiesOf[champion].isBasicAttack(ability);
}

export function damageRule(champion: PlayableChampionId, ability: DamageAbilityKey): string {
  return abilitiesOf[champion].damageRule(ability);
}
