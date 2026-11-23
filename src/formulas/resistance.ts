// How armor and magic resist (MR) reduce damage, and how penetration gets around them.
// "Resist" below means armor or MR: the same rules apply to both.
import { resistance } from "../data/game-rules.ts";
import { combinePercent } from "../stats/combine.ts";

// The fraction of damage that gets through. 100 resist → 0.5 (half the damage).
export function damageMultiplier(resist: number): number {
  const k = resistance.formulaConstant;
  if (resist >= 0) {
    return k / (k + resist);
  }
  return 2 - k / (k - resist); // negative resist: you take MORE than full damage
}

// Everything the attacker has that lowers the target's resist.
// Percentages are fractions: 0.3 means 30%.
//   reduction   = really lowers the target's resist (can go below 0 if flat)
//   penetration = the attacker ignores part of it (never below 0)
export type ResistShred = {
  flatReduction: number;
  percentReduction: number;
  percentPenetration: number;
  percentBonusPenetration: number; // only affects bonus resist (from items). Armor only, in practice.
  flatPenetration: number; // lethality for armor, flat magic pen for MR
};

export const noShred: ResistShred = {
  flatReduction: 0,
  percentReduction: 0,
  percentPenetration: 0,
  percentBonusPenetration: 0,
  flatPenetration: 0,
};

// Adds one more source of shred (e.g. Black Cleaver's stacks) to what's already there.
// Flat amounts add up. Percentages multiply, like two % penetrations do (see combinePercent).
export function addShred(shred: ResistShred, extra: Partial<ResistShred>): ResistShred {
  return {
    flatReduction: shred.flatReduction + (extra.flatReduction ?? 0),
    percentReduction: combinePercent([shred.percentReduction, extra.percentReduction ?? 0]),
    percentPenetration: combinePercent([shred.percentPenetration, extra.percentPenetration ?? 0]),
    percentBonusPenetration: combinePercent([shred.percentBonusPenetration, extra.percentBonusPenetration ?? 0]),
    flatPenetration: shred.flatPenetration + (extra.flatPenetration ?? 0),
  };
}

// The resist the target counts as having when the damage lands.
// baseResist = from the champion and levels, bonusResist = from items.
// Order of steps is from the wiki's Armor penetration page.
export function effectiveResist(baseResist: number, bonusResist: number, shred: ResistShred): number {
  let base = baseResist;
  let bonus = bonusResist;

  // 1. Flat reduction, split between base and bonus in proportion to their size.
  const total = base + bonus;
  if (total > 0) {
    base -= shred.flatReduction * (base / total);
    bonus -= shred.flatReduction * (bonus / total);
  } else {
    base -= shred.flatReduction;
  }

  // Steps 2-5 do nothing if resist is already 0 or below.
  if (base + bonus <= 0) {
    return base + bonus;
  }

  // 2. Percentage reduction.
  base *= 1 - shred.percentReduction;
  bonus *= 1 - shred.percentReduction;

  // 3. Percentage penetration, then percentage penetration of bonus resist only.
  base *= 1 - shred.percentPenetration;
  bonus *= 1 - shred.percentPenetration;
  bonus *= 1 - shred.percentBonusPenetration;

  // 4. Flat penetration. Can't take resist below 0.
  return Math.max(0, base + bonus - shred.flatPenetration);
}
