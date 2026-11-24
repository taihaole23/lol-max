// Akali's R2 (Perfect Execution recast) bonus from the target's missing health.
import { akali } from "../data/akali.ts";

const r = akali.perfectExecution;

// The share of health the target is missing: 1000 / 4000 HP → 0.75.
export function missingHealthShare(currentHp: number, maxHp: number): number {
  return Math.min(Math.max(1 - currentHp / maxHp, 0), 1);
}

// How much R2's damage is raised, as a fraction: 0 at full health, 2 (+200%) at 70% missing or more.
// Wiki table: 7% missing → +20%, 35% → +100%, 70% → +200%.
export function missingHealthBonus(currentHp: number, maxHp: number): number {
  const missing = missingHealthShare(currentHp, maxHp);
  return r.maxMissingHealthBonus * Math.min(missing / r.missingHealthForMaxBonus, 1);
}
