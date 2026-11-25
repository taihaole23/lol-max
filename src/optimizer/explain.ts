// Everything the site shows for one build: the breakdowns, and how much each item adds.
import type { Item } from "../data/items.ts";
import type { DamageAbilityKey, PlayableChampionId } from "../data/playable-champions.ts";
import { breakdown, type Breakdown } from "../simulation/breakdown.ts";
import { critTotals, simulateBuild, type CritTotals } from "../simulation/simulate-build.ts";
import type { Target } from "../simulation/simulate.ts";

export type BuildExplanation = {
  breakdown: Breakdown;
  noItemsDamage: number; // the same cast with no items at all
  // Each item's marginal damage: damage with the build minus damage without that one item.
  marginal: { item: Item; damage: number }[];
  // What's left over: total = no items + every marginal + interactions.
  // Items that boost each other (Rabadon's × another AP item) make it NEGATIVE: the boost
  // is in both items' marginals, so it was counted twice, and this takes one copy back out.
  interactions: number;
  // Only for an ability that can crit (Yone's Q): the total without and with a crit. Everything
  // above is the peak: the crit if the crit chance is above 0, otherwise the no-crit cast.
  crit?: CritTotals;
};

// `rank` and `ability` default like simulateBuild's (R at the highest rank the level allows).
export function explainBuild(
  champion: PlayableChampionId,
  level: number,
  items: Item[],
  target: Target,
  rank?: number,
  ability?: DamageAbilityKey,
  stacks = 0, // Veigar's passive stacks (championStats)
): BuildExplanation {
  const totalOf = (build: Item[]) => breakdown(simulateBuild(champion, level, build, target, rank, ability, stacks).events).total;

  const result = breakdown(simulateBuild(champion, level, items, target, rank, ability, stacks).events);
  const noItemsDamage = totalOf([]);
  const marginal = items.map((item) => ({
    item,
    damage: result.total - totalOf(items.filter((other) => other !== item)),
  }));
  const sumOfMarginals = marginal.reduce((sum, m) => sum + m.damage, 0);

  const crit = critTotals(champion, level, items, target, rank, ability, stacks);

  return {
    breakdown: result,
    noItemsDamage,
    marginal,
    interactions: result.total - noItemsDamage - sumOfMarginals,
    ...(crit ? { crit } : {}),
  };
}
