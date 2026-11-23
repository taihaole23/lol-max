// Everything the site shows for one build: the breakdowns, and how much each item adds.
import type { Item } from "../data/items.ts";
import type { RRank } from "../formulas/death-lotus.ts";
import { breakdown, type Breakdown } from "../simulation/breakdown.ts";
import { simulateBuild } from "../simulation/simulate-build.ts";
import type { Target } from "../simulation/simulate.ts";

export type BuildExplanation = {
  breakdown: Breakdown;
  noItemsDamage: number; // the same ult with no items at all
  // Each item's marginal damage: damage with the build minus damage without that one item.
  marginal: { item: Item; damage: number }[];
  // What's left over: total = no items + every marginal + interactions.
  // Items that boost each other (Rabadon's × another AP item) make it NEGATIVE: the boost
  // is in both items' marginals, so it was counted twice, and this takes one copy back out.
  interactions: number;
};

// `rank` defaults to the highest rank the level allows, like simulateBuild.
export function explainBuild(level: number, items: Item[], target: Target, rank?: RRank): BuildExplanation {
  const totalOf = (build: Item[]) => breakdown(simulateBuild(level, build, target, rank).events).total;

  const result = breakdown(simulateBuild(level, items, target, rank).events);
  const noItemsDamage = totalOf([]);
  const marginal = items.map((item) => ({
    item,
    damage: result.total - totalOf(items.filter((other) => other !== item)),
  }));
  const sumOfMarginals = marginal.reduce((sum, m) => sum + m.damage, 0);

  return {
    breakdown: result,
    noItemsDamage,
    marginal,
    interactions: result.total - noItemsDamage - sumOfMarginals,
  };
}
