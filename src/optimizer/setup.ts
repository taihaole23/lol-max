// What the user picks for the champion: their level, which ability to calculate and its rank, and how
// many legendary item slots to fill. A game stage is just a preset that fills these in; the user
// can change each one afterwards.
import { championLevels, inventory } from "../data/game-rules.ts";
import type { DamageAbilityKey, PlayableChampionId } from "../data/playable-champions.ts";
import { stages, type StageName } from "../data/stages.ts";
import { checkAbilityRank, recommendedRanks } from "../stats/ability-ranks.ts";
import type { BootsSetting } from "./item-pool.ts";

export type ChampionSetup = {
  champion: PlayableChampionId; // whose ability it is
  level: number;
  ability: DamageAbilityKey; // the ability whose damage is calculated
  rank: number; // that ability's rank
  itemCount: number; // legendary items only; boots get their own slot on top
};

// The preset for a stage: its level, the ability's rank in the usual skill order at that level
// (Katarina, Early, level 6: Q 3, E 1, R 1), and its item count.
export function stagePreset(
  champion: PlayableChampionId,
  stage: StageName,
  boots: BootsSetting,
  ability: DamageAbilityKey = "r",
): ChampionSetup {
  const { level, itemsWithBoots, itemsWithoutBoots } = stages[stage];
  return {
    champion,
    level,
    ability,
    rank: recommendedRanks(champion, level)[ability],
    itemCount: boots === "off" ? itemsWithoutBoots : itemsWithBoots,
  };
}

// The most legendary items a build can hold: 6 slots, minus one if boots take a slot.
export function maxItemCount(boots: BootsSetting): number {
  return boots === "off" ? inventory.slots : inventory.slots - 1;
}

// Throws on a setup the game can't have, so a bug in the page can't show impossible numbers.
export function checkSetup(setup: ChampionSetup, boots: BootsSetting): void {
  if (!Number.isInteger(setup.level) || setup.level < 1 || setup.level > championLevels.max) {
    throw new Error(`Level must be 1 to ${championLevels.max} (got ${setup.level}).`);
  }
  checkAbilityRank(setup.level, setup.ability, setup.rank);
  const max = maxItemCount(boots);
  if (!Number.isInteger(setup.itemCount) || setup.itemCount < 1 || setup.itemCount > max) {
    throw new Error(`Item count must be 1 to ${max} (got ${setup.itemCount}).`);
  }
}
