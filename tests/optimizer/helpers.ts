// Shared setup for the optimizer tests. Not a test file itself.
import { dummyPresets, type EnemyType } from "../../src/data/dummy-presets.ts";
import { stages, type StageName } from "../../src/data/stages.ts";
import { dummyStats, recommendedDummyItems } from "../../src/stats/dummy-stats.ts";
import { buildKey, type FoundBuild } from "../../src/optimizer/top-builds.ts";

// The dummy the site would use: the enemy type's champion at the stage's level, with recommended items.
export function presetDummy(enemyType: EnemyType, stage: StageName) {
  return dummyStats(dummyPresets[enemyType].champion, stages[stage].level, recommendedDummyItems(enemyType, stage));
}

export const enemyTypes = Object.keys(dummyPresets) as EnemyType[];

// A short, readable summary of a top 5, for comparing two searches.
export function summary(builds: FoundBuild[]) {
  return builds.map((build) => `${buildKey(build)}: ${build.damage.toFixed(3)}`);
}
