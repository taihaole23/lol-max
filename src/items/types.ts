// The shape every hand-coded item passive follows. One file per item in this folder,
// listed in index.ts.
import type { Item } from "../data/items.ts";
import type { KatarinaStats } from "../stats/katarina-stats.ts";
import type { ItemEffect } from "../simulation/simulate.ts";

// Extra things a stat passive may read besides Katarina's current stats.
export type StatContext = {
  level: number; // the level her stats were computed at (after Rod of Ages' extra level)
  baseHealth: number; // health from her level alone, so bonus health = health − baseHealth
  baseAd: number; // AD from her level alone
  items: readonly Item[]; // the whole build, for passives that read plain item stats (Warmog's)
};

// Stat passives run in this order, after the plain item stats are added up.
// Each step can use what the steps before it produced.
//   1. "add":      passives that add a stat (Warmog's and Rod of Ages HP, Hexplate's attack and move speed).
//   2. "convert":  passives that turn one stat into another (Riftmaker HP → AP, Overlord's HP → AD, Sterak's).
//   3. "adaptive": adaptive force (Swiftmarch). It picks AD or AP by comparing the stats after step 2.
//   4. "percent":  % increases of a stat (Rabadon's +30% AP). They add to `apPercentBonus`, which
//                  katarinaStats applies at the very end, so it multiplies AP from steps 1-3 too.
export const statSteps = ["add", "convert", "adaptive", "percent"] as const;
export type StatStep = (typeof statSteps)[number];

export type ItemPassive = {
  name: string; // the exact item name, as in the item snapshot

  // Levels added to Katarina's level for her stats (Rod of Ages at full stacks).
  extraLevels?: number;

  // A passive that changes Katarina's stats before the ult. It changes `stats` in place.
  stats?: {
    step: StatStep;
    apply: (stats: KatarinaStats, context: StatContext) => void;
  };

  // A passive that does something DURING the ult (on-hit damage, stacks...).
  // It's a function that makes a fresh effect, because an effect may remember things
  // (like "Spellblade already used") and every simulation must start clean.
  createEffect?: () => ItemEffect;
};
