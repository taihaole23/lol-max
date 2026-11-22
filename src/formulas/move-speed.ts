// Move speed with the game's soft caps (wiki: Movement speed).
import { moveSpeed } from "../data/game-rules.ts";

// `flatTotal` = base move speed + flat bonuses (boots).
// `percentBonus` = all % bonuses added together (0.1 = +10%).
export function totalMoveSpeed(flatTotal: number, percentBonus: number): number {
  const raw = flatTotal * (1 + percentBonus);
  const { firstCapAt, firstCapKeeps, secondCapAt, secondCapKeeps } = moveSpeed;

  if (raw <= firstCapAt) return raw;
  if (raw <= secondCapAt) return firstCapAt + (raw - firstCapAt) * firstCapKeeps;
  return firstCapAt + (secondCapAt - firstCapAt) * firstCapKeeps + (raw - secondCapAt) * secondCapKeeps;
}
