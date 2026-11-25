// The shape every hand-coded item passive follows. One file per item in this folder,
// listed in index.ts.
import type { Item } from "../data/items.ts";
import type { DamageAbilityKey } from "../data/playable-champions.ts";
import type { ChampionStats } from "../stats/champion-stats.ts";
import { championSize } from "../data/game-rules.ts";
import type { ItemEffect } from "../simulation/simulate.ts";

// Extra things a stat passive may read besides the champion's current stats.
export type StatContext = {
  level: number; // the level her stats were computed at (after Rod of Ages' extra level)
  baseHealth: number; // health from her level alone, so bonus health = health − baseHealth
  baseAd: number; // AD from her level alone
  items: readonly Item[]; // the whole build, for passives that read plain item stats (Warmog's)
  ability: DamageAbilityKey; // the ability being cast (Hexplate only switches on for R)
  adaptiveWhenTied: "ad" | "ap"; // what adaptive force gives when bonus AD = AP (the champion's data file)
  ranged?: boolean; // a ranged champion (some items give ranged champions less: Hexplate). Default: melee.
};

// Who holds the item, for effects that depend on it:
// - `ranged`: many items have a smaller ranged number (Blade of the Ruined King: 9% melee, 6% ranged).
// - `distance`: how far the champion stands from the dummy, in units, EDGE to edge (the way attack
//   range is measured). Melee champions stand right next to it (0); ranged ones at their attack range
//   (Lux: 550). Items with an aura (Sunfire Aegis: 325 units) only work if the dummy is inside it.
export type Wielder = { ranged: boolean; distance: number };
export const meleeWielder: Wielder = { ranged: false, distance: 0 };

// Is the dummy inside an aura of `radius` units around the champion? The wiki says how each one is
// measured: "centred" = her centre to the dummy's centre (most auras: Sunfire), "centre-to-edge" =
// her centre to the dummy's nearest edge (Abyssal Mask). Both champions are 65 units "wide" (radius).
// A melee champion next to the dummy is inside every aura (none is smaller than 2 × 65).
export function insideAura(wielder: Wielder, radius: number, measured: "centred" | "centre-to-edge"): boolean {
  const edges = measured === "centred" ? 2 : 1;
  return wielder.distance + edges * championSize.gameplayRadius <= radius;
}

// Stat passives run in this order, after the plain item stats are added up.
// Each step can use what the steps before it produced.
//   1. "add":      passives that add a stat (Warmog's and Rod of Ages HP, Hexplate's attack and move speed).
//   2. "convert":  passives that turn one stat into another (Riftmaker HP → AP, Overlord's HP → AD, Sterak's).
//   3. "adaptive": adaptive force (Swiftmarch). It picks AD or AP by comparing the stats after step 2.
//   4. "percent":  % increases of a stat (Rabadon's +30% AP). They add to `apPercentBonus`, which
//                  championStats applies at the very end, so it multiplies AP from steps 1-3 too.
export const statSteps = ["add", "convert", "adaptive", "percent"] as const;
export type StatStep = (typeof statSteps)[number];

export type ItemPassive = {
  name: string; // the exact item name, as in the item snapshot
  source: { url: string; patch: string }; // the item's wiki page (listed in the site's sources section)

  // Levels added to the champion's level for their stats (Rod of Ages at full stacks).
  extraLevels?: number;

  // A passive that changes the champion's stats before the cast. It changes `stats` in place.
  stats?: {
    step: StatStep;
    apply: (stats: ChampionStats, context: StatContext) => void;
  };

  // A passive that does something DURING the ult (on-hit damage, stacks...).
  // It's a function that makes a fresh effect, because an effect may remember things
  // (like "Spellblade already used") and every simulation must start clean.
  // `wielder`: who holds it (see Wielder). Left out = a melee champion next to the dummy.
  createEffect?: (wielder?: Wielder) => ItemEffect;
};
