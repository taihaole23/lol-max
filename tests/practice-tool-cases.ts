// The in-game Practice Tool tests (Step 8): what to set up, and what was measured.
// Eric fills in `measured` after testing in game; tests/practice-tool.test.ts compares them with
// the calculator. The step-by-step instructions are in validation/practice-tool-plan.md.
import { getItem } from "../src/data/items.ts";
import { practiceDummy } from "../src/data/practice-tool.ts";
import { simulateBuild } from "../src/simulation/simulate-build.ts";
import type { RRank } from "../src/formulas/death-lotus.ts";
import type { Target } from "../src/simulation/simulate.ts";

// The patch the measurements were taken on. If the site's patch changes, the test fails until
// the measurements are redone (an old measurement can't prove the new numbers right).
export const measuredOnPatch = "26.23";

export type PracticeCase = {
  id: string;
  checks: string; // what this test proves
  level: number;
  rRank: RRank;
  items: string[];
  dummy: { hp: number; resist: number }; // "resist" = armor AND magic resist (the cheat raises both)
  measured: number[]; // the dummy's "total damage" after each ult. [] = not tested yet.
};

// The dummy as the calculator sees it. It starts at 1000 HP and 0 armor / MR, so everything added
// with the cheats counts as BONUS HP / armor / MR.
export function practiceTarget(dummy: PracticeCase["dummy"]): Target {
  return {
    hp: dummy.hp,
    bonusHp: dummy.hp - practiceDummy.baseHp,
    baseArmor: practiceDummy.baseArmor,
    bonusArmor: dummy.resist,
    baseMagicResist: practiceDummy.baseMagicResist,
    bonusMagicResist: dummy.resist,
  };
}

// What the calculator says one ult does in this case.
export function expectedDamage(c: PracticeCase): number {
  const events = simulateBuild(c.level, c.items.map(getItem), practiceTarget(c.dummy), c.rRank).events;
  return events.reduce((sum, e) => sum + e.amount, 0);
}

const plain = { hp: 3000, resist: 0 };

export const practiceCases: PracticeCase[] = [
  // --- Part 1: no items. Checks base damage per rank, and that nothing else (runes!) adds damage.
  { id: "1", checks: "Base damage, R rank 1", level: 6, rRank: 1, items: [], dummy: plain, measured: [] },
  { id: "2", checks: "Base damage, R rank 2", level: 11, rRank: 2, items: [], dummy: plain, measured: [] },
  { id: "3", checks: "Base damage, R rank 3", level: 16, rRank: 3, items: [], dummy: plain, measured: [] },
  { id: "4", checks: "Magic resist reduces damage", level: 11, rRank: 2, items: [], dummy: { hp: 3000, resist: 50 }, measured: [] },

  // --- Part 2: plain stats.
  { id: "5", checks: "AP ratio (plain AP item)", level: 11, rRank: 2, items: ["Zhonya's Hourglass"], dummy: plain, measured: [] },
  { id: "6", checks: "Rabadon's +AP% (compare with 5)", level: 11, rRank: 2, items: ["Zhonya's Hourglass", "Rabadon's Deathcap"], dummy: plain, measured: [] },
  { id: "7", checks: "Bonus AD ratio (plain AD item)", level: 11, rRank: 2, items: ["Bloodthirster"], dummy: plain, measured: [] },
  { id: "8", checks: "Magic penetration (compare with 4 and 5)", level: 11, rRank: 2, items: ["Void Staff"], dummy: { hp: 3000, resist: 50 }, measured: [] },

  // --- Part 3: on-hit at R's 25 / 30 / 35%.
  { id: "9", checks: "On-hit at rank 1 (25%)", level: 6, rRank: 1, items: ["Nashor's Tooth"], dummy: plain, measured: [] },
  { id: "10", checks: "On-hit at rank 2 (30%)", level: 11, rRank: 2, items: ["Nashor's Tooth"], dummy: plain, measured: [] },
  { id: "11", checks: "On-hit at rank 3 (35%)", level: 16, rRank: 3, items: ["Nashor's Tooth"], dummy: plain, measured: [] },

  // --- Part 4: coded passives, including the open questions in NOTES.md.
  { id: "12", checks: "Liandry's burn + in-combat amp", level: 11, rRank: 2, items: ["Liandry's Torment"], dummy: plain, measured: [] },
  { id: "13", checks: "Riftmaker HP → AP with Warmog's", level: 16, rRank: 3, items: ["Riftmaker", "Warmog's Armor"], dummy: { hp: 4000, resist: 0 }, measured: [] },
  { id: "14", checks: "Luden's Echo (first dagger)", level: 11, rRank: 2, items: ["Luden's Echo"], dummy: plain, measured: [] },
  { id: "15", checks: "BotRK (reads the dummy's current HP; R before on-hit?)", level: 11, rRank: 2, items: ["Blade of The Ruined King"], dummy: plain, measured: [] },
  { id: "16", checks: "Guinsoo's (do daggers give stacks / Phantom Hits?)", level: 11, rRank: 2, items: ["Guinsoo's Rageblade"], dummy: plain, measured: [] },
];
