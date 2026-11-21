// Combines several percentage effects of the same kind, e.g. two % magic penetrations.
// They multiply instead of adding: 40% and 30% → the target keeps 0.6 × 0.7 = 42% → 58% total.
export function combinePercent(percents: number[]): number {
  let kept = 1;
  for (const p of percents) {
    kept *= 1 - p;
  }
  return 1 - kept;
}
