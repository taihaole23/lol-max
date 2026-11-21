// Raw Death Lotus damage: before armor and MR reduce it.
import { katarina } from "../data/katarina.ts";

const r = katarina.deathLotus;

// R rank 1, 2 or 3. Data lists are indexed from 0, so rank 1 is index 0.
export type RRank = 1 | 2 | 3;

// Magic part of one dagger: base damage for the rank + 19% AP.
export function daggerMagicDamage(rank: RRank, ap: number): number {
  return r.magicBaseDamage[rank - 1] + r.magicApRatio * ap;
}

// Physical part of one dagger: (16% + 50% per 100% bonus attack speed) × bonus AD.
// bonusAttackSpeed is a fraction: 0.5 means 50% bonus attack speed.
export function daggerPhysicalDamage(bonusAd: number, bonusAttackSpeed: number): number {
  const ratio = r.physicalBonusAdRatio + r.physicalBonusAdRatioPerBonusAttackSpeed * bonusAttackSpeed;
  return ratio * bonusAd;
}

// The whole channel against one target: every dagger hits.
// Step 4 replaces this shortcut with a dagger-by-dagger simulation.
export function fullChannelRawDamage(rank: RRank, ap: number, bonusAd: number, bonusAttackSpeed: number) {
  return {
    magic: daggerMagicDamage(rank, ap) * r.daggersPerTarget,
    physical: daggerPhysicalDamage(bonusAd, bonusAttackSpeed) * r.daggersPerTarget,
  };
}
