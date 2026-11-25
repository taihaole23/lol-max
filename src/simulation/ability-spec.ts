// Abilities described as DATA, so most champions need no ability code at all.
//
// A champion's data file (e.g. src/data/lux.ts) lists each damaging ability as an `AbilitySpec`:
// when each hit lands, and what each hit deals (base damage by rank + ratios, and its damage type).
// `specCast` below turns that into the AbilityCast the simulation reads, the same shape the
// hand-written champions (Katarina, Akali, Yone, Garen) build in their own files.
//
// Anything a plain "base + ratios" can't say goes in a `modifier`, written and tested once here
// and then reused by every champion that needs it:
//   - missingHealth: more damage the more health the dummy is missing (Veigar's R).
//   - critChance:    more damage the more crit chance the champion has (Caitlyn's R).
// A champion whose ability needs something new gets a new modifier here (with a test), not a new file.
import { simulationRules } from "../data/game-rules.ts";
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import type { AbilityCast, Attacker, DamagePart, DamageType, HitInfo } from "./simulate.ts";

// One number for every rank, or one per rank (index 0 = rank 1).
export type RankValue = number | readonly number[];

// What a ratio multiplies: AP, TOTAL AD (base + bonus), or BONUS AD only. The wiki writes "AD" for
// total AD and "bonus AD" for bonus AD.
export type RatioStat = "ap" | "ad" | "bonusAd";

// One piece of a hit's damage, all of one damage type. e.g. Lux's Q:
//   { type: "magic", base: [80, 120, 160, 200, 240], ratios: { ap: 0.75 } }
export type PartSpec = {
  type: DamageType;
  base: readonly number[]; // by rank
  ratios?: Partial<Record<RatioStat, RankValue>>;
};

export type ModifierSpec =
  // Damage raised by up to `maxBonus` (1 = +100%), growing evenly with the dummy's missing health and
  // reaching the maximum at `missingForMax` missing (Veigar's R: +100% at 2/3 missing). Worked out from
  // the dummy's health just before the hit lands.
  | { kind: "missingHealth"; maxBonus: number; missingForMax: number }
  // Damage raised by up to `maxBonus` at 100% crit chance, growing evenly with crit chance. Like a
  // crit, it grows with crit damage: × (crit damage − 1), so Infinity Edge (+30% crit damage) makes
  // Caitlyn's R +39% instead of +30% (wiki template "critical damage", critScaling).
  | { kind: "critChance"; maxBonus: number };

export type HitSpec = {
  time: number; // seconds after the cast
  name?: string; // shown in the breakdown when an ability has several hits ("Detonation")
  parts: readonly PartSpec[];
  // Added on top of the hit's parts, as their own line ("missingHealth", "critChance") so the
  // breakdown shows what it added. Same damage type as the hit's first part.
  modifier?: ModifierSpec;
};

export type AbilitySpec = {
  source: { url: string; patch: string };
  hits: readonly HitSpec[];
  // Does each hit apply on-hit / on-attack effects (Ezreal's Q)? Default: no.
  appliesOnHit?: boolean;
  appliesOnAttack?: boolean;
  // True if casting it grants Spellblade before its hit lands, so the hit uses it. Only abilities
  // that apply on-hit effects can (wiki, Spellblade notes). Default: false.
  spellbladeReadyForHits?: boolean;
  // How the hits count for items:
  //   "ability" (default): ability damage, like almost every ability.
  //   "basic":  basic damage only (no Liandry's, Luden's...).
  //   "both":   basic damage that is ALSO tagged as ability damage (Ezreal's Q: "deals basic damage,
  //             but also triggers spell effects").
  damageKind?: "ability" | "basic" | "both";
  // The one-line rule under the damage total. Left out: worked out from the hits.
  rule?: string;
};

const rankValue = (value: RankValue, rank: number): number => (typeof value === "number" ? value : value[rank - 1]);

const statFor: Record<RatioStat, (a: Attacker) => number> = {
  ap: (a) => a.ap,
  ad: (a) => a.baseAd + a.bonusAd,
  bonusAd: (a) => a.bonusAd,
};

// The source names the breakdown uses (they match the hand-written champions').
const ratioSource: Record<RatioStat, string> = { ap: "apRatio", ad: "adRatio", bonusAd: "bonusAdRatio" };

// How much a modifier raises the hit, as a fraction (0.5 = +50%).
export function modifierBonus(modifier: ModifierSpec, attacker: Attacker, hit: HitInfo): number {
  if (modifier.kind === "missingHealth") {
    const missing = Math.min(Math.max(1 - hit.targetHp / hit.targetMaxHp, 0), 1);
    return modifier.maxBonus * Math.min(missing / modifier.missingForMax, 1);
  }
  return modifier.maxBonus * attacker.critChance * (attacker.critDamage - 1);
}

// The damage pieces of one hit, before armor / MR. Exported for the tests.
export function hitParts(hit: HitSpec, rank: number, attacker: Attacker, info: HitInfo, damageKind: AbilitySpec["damageKind"]): DamagePart[] {
  const abilityDamage = damageKind === "both" ? { abilityDamage: true, basicDamage: true } : {};
  const parts: DamagePart[] = [];
  for (const part of hit.parts) {
    parts.push({ raw: part.base[rank - 1], type: part.type, source: "base", ...abilityDamage });
    for (const [stat, ratio] of Object.entries(part.ratios ?? {}) as [RatioStat, RankValue][]) {
      parts.push({ raw: rankValue(ratio, rank) * statFor[stat](attacker), type: part.type, source: ratioSource[stat], ...abilityDamage });
    }
  }
  if (hit.modifier) {
    const sum = parts.reduce((total, p) => total + p.raw, 0);
    const bonus = modifierBonus(hit.modifier, attacker, info);
    parts.push({ raw: bonus * sum, type: hit.parts[0].type, source: hit.modifier.kind, ...abilityDamage });
  }
  return parts;
}

// The cast the simulation reads. Item effects count until 3 s after the last hit (the one-hit rule).
export function specCast(spec: AbilitySpec, key: DamageAbilityKey, rank: number): AbilityCast {
  const hitTimes = spec.hits.map((h) => h.time);
  const names = spec.hits.map((h) => h.name);
  return {
    key,
    hitTimes,
    hitNames: names.every((n) => n !== undefined) ? (names as string[]) : undefined,
    windowSeconds: Math.max(...hitTimes) + simulationRules.oneHitWindowSeconds,
    hitDamage: (attacker, info) => hitParts(spec.hits[info.index], rank, attacker, info, spec.damageKind),
    appliesOnHit: spec.appliesOnHit ?? false,
    appliesOnAttack: spec.appliesOnAttack ?? false,
    onHitEffectiveness: 1,
    procEffectiveness: 1,
    spellbladeReadyForHits: spec.spellbladeReadyForHits ?? false,
    basicDamage: spec.damageKind === "basic" || spec.damageKind === "both",
  };
}

// The rule shown under the damage total, e.g. "One hit, plus item effects up to 3 s after it."
export function specRule(spec: AbilitySpec): string {
  if (spec.rule) return spec.rule;
  const after = `plus item effects up to ${simulationRules.oneHitWindowSeconds} s after`;
  const last = Math.max(...spec.hits.map((h) => h.time));
  if (spec.hits.length === 1) return last === 0 ? `One hit, ${after} it.` : `One hit, landing ${last} s after the cast, ${after} it.`;
  return `${spec.hits.length} hits over ${last} s, ${after} the last one.`;
}
