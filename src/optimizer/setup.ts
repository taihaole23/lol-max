// What the user picks for Katarina: her level, R rank and how many legendary item slots to fill.
// A game stage is just a preset that fills these in; the user can change each one afterwards.
import { championLevels, inventory } from "../data/game-rules.ts";
import { stages, type StageName } from "../data/stages.ts";
import type { RRank } from "../formulas/death-lotus.ts";
import { checkRRank, rRankAtLevel } from "../stats/katarina-stats.ts";
import type { BootsSetting } from "./item-pool.ts";

export type KatarinaSetup = {
  level: number;
  rRank: RRank;
  itemCount: number; // legendary items only; boots get their own slot on top
};

// The preset for a stage: its level, the highest R rank at that level, and its item count.
export function stagePreset(stage: StageName, boots: BootsSetting): KatarinaSetup {
  const { level, itemsWithBoots, itemsWithoutBoots } = stages[stage];
  return {
    level,
    rRank: rRankAtLevel(level),
    itemCount: boots === "off" ? itemsWithoutBoots : itemsWithBoots,
  };
}

// The most legendary items a build can hold: 6 slots, minus one if boots take a slot.
export function maxItemCount(boots: BootsSetting): number {
  return boots === "off" ? inventory.slots : inventory.slots - 1;
}

// Throws on a setup the game can't have, so a bug in the page can't show impossible numbers.
export function checkSetup(setup: KatarinaSetup, boots: BootsSetting): void {
  if (!Number.isInteger(setup.level) || setup.level < 1 || setup.level > championLevels.max) {
    throw new Error(`Level must be 1 to ${championLevels.max} (got ${setup.level}).`);
  }
  checkRRank(setup.level, setup.rRank);
  const max = maxItemCount(boots);
  if (!Number.isInteger(setup.itemCount) || setup.itemCount < 1 || setup.itemCount > max) {
    throw new Error(`Item count must be 1 to ${max} (got ${setup.itemCount}).`);
  }
}
