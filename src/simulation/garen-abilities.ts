// What each of Garen's damaging abilities does, in the shape the simulation reads (AbilityCast).
// The numbers come from src/data/garen.ts. W (Courage) deals no damage.
//
// - Q is an empowered basic attack: one hit, with item effects counted up to 3 s after it (the
//   one-hit rule). Its attack part can crit, so the site shows "no crit / crit" like Yone's Q.
// - E is a 3-second spin: several hits, item effects counted up to 3 s after the last one.
//   Spins can crit too, but there are many of them, so each spin counts its AVERAGE damage at the
//   build's crit chance (Eric) and E shows one number.
// - R is one hit of true damage that grows with the dummy's missing health. The page's "Health %"
//   box sets the dummy's health when the cast starts (Eric: starts at 100%).
import { simulationRules } from "../data/game-rules.ts";
import { garen } from "../data/garen.ts";
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import type { AbilityCast, Attacker, DamagePart, HitInfo } from "./simulate.ts";

const q = garen.decisiveStrike;
const e = garen.judgment;
const r = garen.demacianJustice;

const totalAd = (a: Attacker) => a.baseAd + a.bonusAd;

// Decisive Strike (Q): the basic attack (100% AD, basic damage, can crit) + the bonus
// (base + 50% AD, ability damage, never crits). On a crit only the attack part grows; the extra
// is its own piece ("crit"), so the site can show how much the crit added.
export function decisiveStrikeParts(rank: number, a: Attacker, crit: boolean): DamagePart[] {
  const attack = q.attackAdRatio * totalAd(a);
  const parts: DamagePart[] = [
    { raw: attack, type: "physical", source: "attack" },
    { raw: q.physicalBonusDamage[rank - 1], type: "physical", source: "base", abilityDamage: true },
    { raw: q.bonusAdRatio * totalAd(a), type: "physical", source: "adRatio", abilityDamage: true },
  ];
  if (crit) parts.push({ raw: attack * (a.critDamage * a.critDamageModifier - 1), type: "physical", source: "crit" });
  return parts;
}

// How many times Judgment (E) spins: 7, +1 for every full 25% bonus attack speed (items + levels).
// The count is fixed when E is cast. (The tiny extra guards against 0.75 / 0.25 = 2.9999999.)
export function judgmentSpins(a: Attacker): number {
  return e.baseSpins + Math.floor(a.bonusAttackSpeed / e.bonusAttackSpeedPerExtraSpin + 1e-9);
}

// When each spin hits: "Each spin deals damage ... when the spin is completed", spread evenly over
// 3 s, so with 7 spins at 3/7, 6/7, ... and the last at 3 s.
// ASSUMPTION (the wiki doesn't give the timing): to check in the Practice Tool.
export function judgmentHitTimes(spins: number): number[] {
  const times: number[] = [];
  for (let i = 1; i <= spins; i++) times.push((i * e.spinSeconds) / spins);
  return times;
}

// How much bigger a spin gets on a crit: 30% of the usual crit bonus. 1.3, or 1.39 with Infinity Edge.
export function judgmentCritMultiplier(a: Attacker): number {
  return 1 + e.critBonusShare * (a.critDamage * a.critDamageModifier - 1);
}

// One spin: base + AD ratio, +25% (the dummy is always the nearest enemy), physical. The crit is
// the AVERAGE extra at the build's crit chance (Eric): 40% crit → 40% of what a crit would add.
export function judgmentSpinParts(rank: number, a: Attacker): DamagePart[] {
  const i = rank - 1;
  const nearest = 1 + e.nearestEnemyBonus;
  const base = e.physicalDamagePerSpin[i] * nearest;
  const adPart = e.adRatioPerSpin[i] * totalAd(a) * nearest;
  const averageCrit = (base + adPart) * a.critChance * (judgmentCritMultiplier(a) - 1);
  return [
    { raw: base, type: "physical", source: "base" },
    { raw: adPart, type: "physical", source: "adRatio" },
    { raw: averageCrit, type: "physical", source: "averageCrit" },
  ];
}

// Demacian Justice (R): true damage, base + a share of the dummy's missing health when it lands.
export function demacianJusticeParts(rank: number, hit: HitInfo): DamagePart[] {
  const i = rank - 1;
  return [
    { raw: r.trueBaseDamage[i], type: "true", source: "base" },
    { raw: r.missingHealthRatio[i] * (hit.targetMaxHp - hit.targetHp), type: "true", source: "missingHealth" },
  ];
}

// What every Garen cast starts from: one hit at 0 s, the one-hit item window, no on-hit.
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

// Q is a basic attack: on-hit and on-attack effects at full strength, and its hit is basic damage
// (except the bonus, which is ability damage: see decisiveStrikeParts).
// Spellblade: casting Q grants it, and the empowered attack uses it.
// ASSUMPTION (the wiki doesn't name Spellblade for Q): any ability cast grants Spellblade and the
// next basic attack uses it, so it should. To check in the Practice Tool.
export function decisiveStrikeCast(rank: number, crit: boolean): AbilityCast {
  return {
    ...oneHit("q", (a) => decisiveStrikeParts(rank, a, crit)),
    appliesOnHit: true,
    appliesOnAttack: true,
    onHitEffectiveness: 1,
    spellbladeReadyForHits: true,
    basicDamage: true,
  };
}

// E: one hit per spin, the 25% armor reduction after 6 spins, item effects until 3 s after the last spin.
// Casting E grants Spellblade, but no basic attack follows, so it never procs.
export function judgmentCast(rank: number, attacker: Attacker): AbilityCast {
  const hitTimes = judgmentHitTimes(judgmentSpins(attacker));
  return {
    ...oneHit("e", (a) => judgmentSpinParts(rank, a)),
    hitTimes,
    windowSeconds: Math.max(...hitTimes) + simulationRules.oneHitWindowSeconds,
    armorReduction: { afterHits: e.hitsForArmorReduction, percent: e.armorReduction },
    oneCastInstance: true, // one cast, many spins: one Eclipse stack
  };
}

// The cast for any of his damaging abilities. The rank must already be checked (checkAbilityRank).
// `crit` only changes Q. `attacker` (his stats when he casts) only changes E: how many spins.
export function garenCast(ability: DamageAbilityKey, rank: number, crit: boolean, attacker: Attacker): AbilityCast {
  if (ability === "q") return decisiveStrikeCast(rank, crit);
  if (ability === "e") return judgmentCast(rank, attacker);
  if (ability === "r") return oneHit("r", (_a, hit) => demacianJusticeParts(rank, hit));
  throw new Error(`Garen's ${ability.toUpperCase()} deals no damage.`);
}

export const garenCanCrit = (ability: DamageAbilityKey) => ability === "q";

// The one-line rule the page shows under the damage total.
export function garenDamageRule(ability: DamageAbilityKey): string {
  const window = simulationRules.oneHitWindowSeconds;
  if (ability === "q") {
    return `One empowered attack, plus item effects up to ${window} s after it. The attack can crit: no crit / crit. Builds are ranked by the crit (if they can crit at all).`;
  }
  if (ability === "e") {
    return `Every spin over ${e.spinSeconds} s (${e.baseSpins} + 1 per 25% bonus attack speed), crits counted at their average, plus item effects up to ${window} s after the last spin.`;
  }
  return `One hit, with the dummy at its "Health %", plus item effects up to ${window} s after it.`;
}
