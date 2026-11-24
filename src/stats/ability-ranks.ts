// The game's rules for ability ranks, and each champion's usual skill order.
//   - R can reach rank 1 / 2 / 3 at levels 6 / 11 / 16.
//   - Q, W and E can reach rank 1 / 2 / 3 / 4 / 5 at levels 1 / 3 / 5 / 7 / 9.
//   - One skill point per level: all ranks together add up to at most the level.
import { basicAbilityRanks, skillPoints, ultimateRanks } from "../data/game-rules.ts";
import { playableChampions, type AbilityKey, type PlayableChampionId } from "../data/playable-champions.ts";

export type AbilityRanks = Record<AbilityKey, number>;

export const noRanks: AbilityRanks = { q: 0, w: 0, e: 0, r: 0 };

// The highest rank an ability can have at a level: Q at level 6 → 3, R at level 6 → 1, R at level 5 → 0.
export function maxRankAtLevel(ability: AbilityKey, level: number): number {
  const unlockLevels = ability === "r" ? ultimateRanks.levels : basicAbilityRanks.levels;
  return unlockLevels.filter((unlockedAt) => level >= unlockedAt).length;
}

// The highest R rank at a level: 6-10 → 1, 11-15 → 2, 16+ → 3. Throws below level 6.
export function rRankAtLevel(level: number): number {
  const rank = maxRankAtLevel("r", level);
  if (rank === 0) throw new Error(`No R before level ${ultimateRanks.levels[0]} (got level ${level}).`);
  return rank;
}

// The R ranks possible at a level: level 8 → [1], level 13 → [1, 2], level 5 → [].
export function allowedRRanks(level: number): number[] {
  const ranks: number[] = [];
  for (let rank = 1; rank <= maxRankAtLevel("r", level); rank++) ranks.push(rank);
  return ranks;
}

export function skillPointsAtLevel(level: number): number {
  return level * skillPoints.perLevel;
}

export function pointsSpent(ranks: AbilityRanks): number {
  return ranks.q + ranks.w + ranks.e + ranks.r;
}

// True if a champion of this level can really have these ranks.
export function ranksAreLegal(level: number, ranks: AbilityRanks): boolean {
  const keys = Object.keys(ranks) as AbilityKey[];
  const eachOk = keys.every((key) => {
    const rank = ranks[key];
    return Number.isInteger(rank) && rank >= 0 && rank <= maxRankAtLevel(key, level);
  });
  return eachOk && pointsSpent(ranks) <= skillPointsAtLevel(level);
}

// A champion's ranks at a level, leveling up in the usual order (the data file's skillOrder).
// Katarina at level 6 → Q 3, W 1, E 1, R 1. Early game never maxes W.
export function recommendedRanks(champion: PlayableChampionId, level: number): AbilityRanks {
  const { start, priority } = playableChampions[champion].skillOrder;
  const ranks = { ...noRanks };
  for (let atLevel = 1; atLevel <= level; atLevel++) {
    // The first levels take the start order; if that ability can't be ranked up, fall back to the priority.
    const startPick = atLevel <= start.length ? [start[atLevel - 1]] : [];
    const choices: AbilityKey[] = [...startPick, ...priority];
    const pick = choices.find((key) => ranks[key] < maxRankAtLevel(key, atLevel));
    if (pick) ranks[pick]++;
  }
  return ranks;
}

// Stops impossible states, like a rank 4 Q at level 6 or a rank 0 ability being calculated.
// The page never allows these, so this only fires if some code has a bug.
export function checkAbilityRank(level: number, ability: AbilityKey, rank: number): void {
  const highest = maxRankAtLevel(ability, level);
  if (!Number.isInteger(rank) || rank < 1 || rank > highest) {
    const name = ability.toUpperCase();
    throw new Error(`${name} rank ${rank} isn't possible at level ${level} (it can be rank 1 to ${highest}).`);
  }
}
