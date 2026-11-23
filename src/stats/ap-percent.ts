// Adds a % AP bonus DURING the ult (Blackfire Torch), to stats that already include the
// % bonuses from before the ult (Rabadon's).
// % AP bonuses add to each other, so: take the old % back out, then multiply by the new total.
// Example: 100 AP × 1.3 = 130 with Rabadon's. +4% → 130 ÷ 1.3 × 1.34 = 134 (not 130 × 1.04 = 135.2).
import type { Attacker } from "../simulation/simulate.ts";

export function addApPercent(attacker: Attacker, extra: number): void {
  const apBeforePercent = attacker.ap / (1 + attacker.apPercentBonus);
  attacker.apPercentBonus += extra;
  attacker.ap = apBeforePercent * (1 + attacker.apPercentBonus);
}
