// What each of Akali's damaging abilities does, in the shape the simulation reads (AbilityCast).
// The numbers come from src/data/akali.ts. None of her abilities apply on-hit or on-attack effects,
// so they can't use Spellblade either (it needs an on-hit), even though casting E or R grants it.
//
// The damage window (Eric: item effects count "for as long as items need"): 3 s after the LAST hit,
// the same rule as one-hit abilities. Q and E: 3 s. R: R2 lands at 2.5 s, so 5.5 s.
import { akali } from "../data/akali.ts";
import { simulationRules } from "../data/game-rules.ts";
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import { missingHealthBonus } from "../formulas/perfect-execution.ts";
import type { AbilityCast, Attacker, DamagePart, HitInfo } from "./simulate.ts";

const q = akali.fivePointStrike;
const e = akali.shurikenFlip;
const r = akali.perfectExecution;

const totalAd = (a: Attacker) => a.baseAd + a.bonusAd;

// What every Akali cast shares: no on-hit, no on-attack, no Spellblade, and no Death Lotus bug.
function akaliCast(key: DamageAbilityKey, hitTimes: number[], hitDamage: AbilityCast["hitDamage"], hitNames?: string[]): AbilityCast {
  return {
    key,
    hitTimes,
    hitNames,
    windowSeconds: Math.max(...hitTimes) + simulationRules.oneHitWindowSeconds,
    hitDamage,
    appliesOnHit: false,
    appliesOnAttack: false,
    onHitEffectiveness: 0,
    procEffectiveness: 1,
    spellbladeReadyForHits: false,
  };
}

// Five Point Strike (Q): base + TOTAL AD ratio + AP ratio, all magic. Exported for its own test.
export function fivePointStrikeParts(rank: number, a: Attacker): DamagePart[] {
  return [
    { raw: q.magicBaseDamage[rank - 1], type: "magic", source: "base" },
    { raw: q.magicAdRatio * totalAd(a), type: "magic", source: "adRatio" },
    { raw: q.magicApRatio * a.ap, type: "magic", source: "apRatio" },
  ];
}

// Shuriken Flip (E): the first cast or the recast. Same shape, different numbers.
export function shurikenFlipParts(rank: number, a: Attacker, cast: "first" | "recast"): DamagePart[] {
  const numbers = e[cast];
  return [
    { raw: numbers.magicBaseDamage[rank - 1], type: "magic", source: "base" },
    { raw: numbers.magicAdRatio * totalAd(a), type: "magic", source: "adRatio" },
    { raw: numbers.magicApRatio * a.ap, type: "magic", source: "apRatio" },
  ];
}

// Perfect Execution, first cast (R1): base + BONUS AD ratio + AP ratio, all magic.
export function perfectExecutionFirstParts(rank: number, a: Attacker): DamagePart[] {
  return [
    { raw: r.first.magicBaseDamage[rank - 1], type: "magic", source: "base" },
    { raw: r.first.magicBonusAdRatio * a.bonusAd, type: "magic", source: "bonusAdRatio" },
    { raw: r.first.magicApRatio * a.ap, type: "magic", source: "apRatio" },
  ];
}

// Perfect Execution, recast (R2): base + AP ratio, then the missing-health bonus on top of both,
// worked out from the dummy's HP just before R2 lands. The bonus is its own piece, so the site can
// show how much the "execute" part added.
export function perfectExecutionRecastParts(rank: number, a: Attacker, hit: HitInfo): DamagePart[] {
  const base = r.recast.magicBaseDamage[rank - 1];
  const apPart = r.recast.magicApRatio * a.ap;
  const bonus = missingHealthBonus(hit.targetHp, hit.targetMaxHp);
  return [
    { raw: base, type: "magic", source: "base" },
    { raw: apPart, type: "magic", source: "apRatio" },
    { raw: bonus * (base + apPart), type: "magic", source: "missingHealth" },
  ];
}

const castNames = ["First cast", "Recast"];

export function akaliCastFor(ability: DamageAbilityKey, rank: number): AbilityCast {
  if (ability === "q") return akaliCast("q", [0], (a) => fivePointStrikeParts(rank, a));
  if (ability === "e") {
    return akaliCast(
      "e",
      [0, e.recastSeconds],
      (a, hit) => shurikenFlipParts(rank, a, hit.index === 0 ? "first" : "recast"),
      castNames,
    );
  }
  return akaliCast(
    "r",
    [0, r.recastSeconds],
    (a, hit) => (hit.index === 0 ? perfectExecutionFirstParts(rank, a) : perfectExecutionRecastParts(rank, a, hit)),
    castNames,
  );
}

// The one-line rule the page shows under the damage total.
export function akaliDamageRule(ability: DamageAbilityKey): string {
  const after = `plus item effects up to ${simulationRules.oneHitWindowSeconds} s after`;
  if (ability === "q") return `One hit, ${after} it.`;
  if (ability === "e") return `First cast and recast, both landing at once, ${after} them.`;
  return `First cast, then the recast ${r.recastSeconds} s later (the earliest the game allows), ${after} the recast.`;
}
