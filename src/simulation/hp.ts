// The overkill rule: the dummy's HP after a hit, never below the minimum.
// The damage itself is still counted in full elsewhere; this only tracks HP.
import { simulationRules } from "../data/game-rules.ts";

export function hpAfterHit(currentHp: number, damage: number): number {
  return Math.max(simulationRules.minimumHp, currentHp - damage);
}
