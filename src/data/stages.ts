// The preset game stages. These are design choices (see CLAUDE.md), not game data,
// so they have no wiki source. A build never has more than 6 slots, which is why
// Full has 5 items when boots take a slot.
export const stages = {
  early: { level: 6, itemsWithBoots: 1, itemsWithoutBoots: 1 },
  mid: { level: 11, itemsWithBoots: 2, itemsWithoutBoots: 2 },
  late: { level: 16, itemsWithBoots: 3, itemsWithoutBoots: 3 },
  full: { level: 18, itemsWithBoots: 5, itemsWithoutBoots: 6 },
} as const;

// "early" | "mid" | "late" | "full", worked out from the object above.
export type StageName = keyof typeof stages;
