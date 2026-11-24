// What each of Katarina's damaging abilities does, in the shape the simulation reads (AbilityCast):
// when its hits land, how much each hit deals, and whether it applies on-hit effects.
// The numbers come from src/data/katarina.ts; the rules for Q and E are in game-rules.ts.
import { simulationRules } from "../data/game-rules.ts";
import { katarina } from "../data/katarina.ts";
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import { daggerPhysicalDamage, type RRank } from "../formulas/death-lotus.ts";
import type { AbilityCast, Attacker, DamagePart } from "./simulate.ts";

const r = katarina.deathLotus;
const q = katarina.bouncingBlade;
const e = katarina.shunpo;

// Death Lotus (R): 15 daggers, one every 0.166 s, over a 2.5 s channel.
export function deathLotusCast(rank: RRank): AbilityCast {
  const hitTimes: number[] = [];
  for (let i = 0; i < r.daggersPerTarget; i++) hitTimes.push(r.firstDaggerSeconds + i * r.secondsBetweenDaggers);

  return {
    key: "r",
    hitTimes,
    windowSeconds: r.channelSeconds,
    // Magic (base + AP ratio) and physical (bonus AD ratio, which grows with bonus attack speed).
    hitDamage: (a) => [
      { raw: r.magicBaseDamage[rank - 1], type: "magic", source: "base" },
      { raw: r.magicApRatio * a.ap, type: "magic", source: "apRatio" },
      { raw: daggerPhysicalDamage(a.bonusAd, a.bonusAttackSpeed), type: "physical", source: "bonusAdRatio" },
    ],
    appliesOnHit: true,
    appliesOnAttack: true,
    onHitEffectiveness: r.onHitEffectiveness[rank - 1],
    procEffectiveness: r.onHitEffectiveness[rank - 1],
    spellbladeReadyForHits: true, // casting R grants Spellblade, and dagger 1 uses it (Eric, from playing)
  };
}

// Bouncing Blade (Q) hit: base + AP ratio, magic. Exported so its formula has its own test.
export function bouncingBladeParts(rank: number, a: Attacker): DamagePart[] {
  return [
    { raw: q.magicBaseDamage[rank - 1], type: "magic", source: "base" },
    { raw: q.magicApRatio * a.ap, type: "magic", source: "apRatio" },
  ];
}

// Shunpo (E) hit: base + TOTAL AD ratio + AP ratio, all magic.
export function shunpoParts(rank: number, a: Attacker): DamagePart[] {
  return [
    { raw: e.magicBaseDamage[rank - 1], type: "magic", source: "base" },
    { raw: e.magicAdRatio * (a.baseAd + a.bonusAd), type: "magic", source: "adRatio" },
    { raw: e.magicApRatio * a.ap, type: "magic", source: "apRatio" },
  ];
}

// Q and E are one hit each. Time 0 is the moment the hit lands, and combat starts then
// (in-combat stacks count from your first damage). Q's 0.25 s cast time and flight come before
// that, and nothing happens during them, so they don't change anything.
function oneHitCast(key: "q" | "e", parts: (a: Attacker) => DamagePart[], appliesOnHit: boolean, onHitEffectiveness: number): AbilityCast {
  return {
    key,
    hitTimes: [0],
    windowSeconds: simulationRules.oneHitWindowSeconds,
    hitDamage: parts,
    appliesOnHit,
    appliesOnAttack: false, // the wiki doesn't say either applies on-attack effects
    onHitEffectiveness,
    procEffectiveness: 1, // the shrinking bug is Death Lotus only
    spellbladeReadyForHits: false, // Q applies no on-hit at all, so it can't use Spellblade; E overrides this below
  };
}

export function bouncingBladeCast(rank: number): AbilityCast {
  return oneHitCast("q", (a) => bouncingBladeParts(rank, a), false, 0);
}

export function shunpoCast(rank: number): AbilityCast {
  const cast = oneHitCast("e", (a) => shunpoParts(rank, a), true, e.onHitEffectiveness);
  return { ...cast, spellbladeReadyForHits: e.spellbladeReadyForItsHit };
}

// The cast for any damaging ability. The rank must already be checked (checkAbilityRank).
export function abilityCast(ability: DamageAbilityKey, rank: number): AbilityCast {
  if (ability === "q") return bouncingBladeCast(rank);
  if (ability === "e") return shunpoCast(rank);
  return deathLotusCast(rank as RRank);
}
