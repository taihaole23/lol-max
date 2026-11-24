// What each of Yone's damaging abilities does, in the shape the simulation reads (AbilityCast).
// The numbers come from src/data/yone.ts. Q, W and R are each one hit on the dummy, with item
// effects counted up to 3 s after it (the one-hit rule). E deals no damage by itself.
//
// Q can critically strike. The site shows the cast without and with a crit, and ranks builds by
// the peak: the crit if the build has any crit chance (src/simulation/simulate-build.ts).
// `crit` below says which of the two casts this is.
import { simulationRules } from "../data/game-rules.ts";
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import { yone } from "../data/yone.ts";
import type { AbilityCast, Attacker, DamagePart, HitInfo } from "./simulate.ts";

const q = yone.mortalSteel;
const w = yone.spiritCleave;
const r = yone.fateSealed;

const totalAd = (a: Attacker) => a.baseAd + a.bonusAd;

// How many times bigger a crit makes the damage that can crit: 2 (+ 0.3 with Infinity Edge),
// × 0.95 for Yone. So 1.9 with no crit damage items.
export function critMultiplier(a: Attacker): number {
  return a.critDamage * a.critDamageModifier;
}

// Mortal Steel (Q): base + TOTAL AD ratio, physical. On a crit only the AD part grows; the extra
// is its own piece ("crit"), so the site can show how much the crit added.
export function mortalSteelParts(rank: number, a: Attacker, crit: boolean): DamagePart[] {
  const adPart = q.physicalAdRatio * totalAd(a);
  const parts: DamagePart[] = [
    { raw: q.physicalBaseDamage[rank - 1], type: "physical", source: "base" },
    { raw: adPart, type: "physical", source: "adRatio" },
  ];
  if (crit) parts.push({ raw: adPart * (critMultiplier(a) - 1), type: "physical", source: "crit" });
  return parts;
}

// Spirit Cleave (W): physical first, then magic, each a flat number + a share of the dummy's max HP.
export function spiritCleaveParts(rank: number, hit: HitInfo): DamagePart[] {
  const i = rank - 1;
  return [
    { raw: w.physicalBaseDamage[i], type: "physical", source: "base" },
    { raw: w.physicalMaxHealthRatio[i] * hit.targetMaxHp, type: "physical", source: "maxHealth" },
    { raw: w.magicBaseDamage[i], type: "magic", source: "base" },
    { raw: w.magicMaxHealthRatio[i] * hit.targetMaxHp, type: "magic", source: "maxHealth" },
  ];
}

// Fate Sealed (R): magic first, then physical, each base + BONUS AD ratio.
export function fateSealedParts(rank: number, a: Attacker): DamagePart[] {
  const i = rank - 1;
  return [
    { raw: r.magicBaseDamage[i], type: "magic", source: "base" },
    { raw: r.magicBonusAdRatio * a.bonusAd, type: "magic", source: "bonusAdRatio" },
    { raw: r.physicalBaseDamage[i], type: "physical", source: "base" },
    { raw: r.physicalBonusAdRatio * a.bonusAd, type: "physical", source: "bonusAdRatio" },
  ];
}

// What every Yone cast shares: one hit at 0 s, the one-hit item window, no Death Lotus bug.
function oneHit(key: DamageAbilityKey, hitDamage: AbilityCast["hitDamage"]): AbilityCast {
  return {
    key,
    hitTimes: [0],
    windowSeconds: simulationRules.oneHitWindowSeconds,
    hitDamage,
    appliesOnHit: false,
    appliesOnAttack: false,
    onHitEffectiveness: 0,
    procEffectiveness: 1,
    spellbladeReadyForHits: false,
  };
}

// Q applies on-hit and on-attack effects at full strength, and its hit is basic damage.
// Spellblade: casting Q grants it before Q's hit lands, and Q's on-hit uses it, like Katarina's E.
// The wiki's Way of the Hunter notes confirm Mortal Steel applies Spellblade (it lists a bug about
// its damage type). ASSUMPTION (to check in the Practice Tool): at full strength, all physical
// (Yone starts with his Steel sword, so the Azakana sword's 50% magic conversion doesn't apply).
export function mortalSteelCast(rank: number, crit: boolean): AbilityCast {
  return {
    ...oneHit("q", (a) => mortalSteelParts(rank, a, crit)),
    appliesOnHit: true,
    appliesOnAttack: true,
    onHitEffectiveness: 1,
    spellbladeReadyForHits: true,
    basicDamage: true,
  };
}

// The cast for any of his damaging abilities. The rank must already be checked (checkAbilityRank).
// `crit` only changes Q (nothing else of his can crit).
export function yoneCast(ability: DamageAbilityKey, rank: number, crit = false): AbilityCast {
  if (ability === "q") return mortalSteelCast(rank, crit);
  if (ability === "w") return oneHit("w", (_a, hit) => spiritCleaveParts(rank, hit));
  if (ability === "r") return oneHit("r", (a) => fateSealedParts(rank, a));
  throw new Error(`Yone's ${ability.toUpperCase()} deals no damage by itself.`);
}

export const yoneCanCrit = (ability: DamageAbilityKey) => ability === "q";

// The one-line rule the page shows under the damage total.
export function yoneDamageRule(ability: DamageAbilityKey): string {
  const rule = `One hit, plus item effects up to ${simulationRules.oneHitWindowSeconds} s after it.`;
  if (ability === "q") return `${rule} Q can crit: no crit / crit. Builds are ranked by the crit (if they can crit at all).`;
  return rule;
}
