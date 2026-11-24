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
  measured: number[]; // the dummy's "total damage" COUNTER after each ult. [] = not tested yet.
  // The dummy's HP read off its HP bar right after the ult. The more reliable reading: the counter
  // adds one physical hit that never happened (see practiceDummy.counterExtraRPhysicalHits).
  hpAfter?: number[];
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

function events(c: PracticeCase) {
  return simulateBuild(c.level, c.items.map(getItem), practiceTarget(c.dummy), c.rRank).events;
}

// What the calculator says one ult REALLY does in this case (what the HP bar shows).
export function expectedDamage(c: PracticeCase): number {
  return events(c).reduce((sum, e) => sum + e.amount, 0);
}

// What the dummy's COUNTER should show: the real damage plus the counter's extra physical hit.
// The extra is the size of R's first physical hit (with no bonus AD there's none, so magic-only
// tests are unchanged). Which physical hit it repeats can't be told apart in plain-AD tests (they're
// all the same size); "the first" fits the Guinsoo's tests, where later hits grow.
export function expectedCounter(c: PracticeCase): number {
  const firstRPhysical = events(c).find((e) => e.source === "bonusAdRatio" && e.amount > 0)?.amount ?? 0;
  return expectedDamage(c) + practiceDummy.counterExtraRPhysicalHits * firstRPhysical;
}

const plain = { hp: 3000, resist: 0 };

// Round 1 measured by Eric on Nov 23, 2026 (patch 26.23), one ult each. Test 15 was typed as a
// second "test 14" in the in-game chat (1696, right after Luden's 896); assumed to be BotRK.
export const practiceCases: PracticeCase[] = [
  // --- Part 1: no items. Checks base damage per rank, and that nothing else (runes!) adds damage.
  { id: "1", checks: "Base damage, R rank 1", level: 6, rRank: 1, items: [], dummy: plain, measured: [375] },
  { id: "2", checks: "Base damage, R rank 2", level: 11, rRank: 2, items: [], dummy: plain, measured: [563] },
  { id: "3", checks: "Base damage, R rank 3", level: 16, rRank: 3, items: [], dummy: plain, measured: [750] },
  { id: "4", checks: "Magic resist reduces damage", level: 11, rRank: 2, items: [], dummy: { hp: 3000, resist: 50 }, measured: [375] },

  // --- Part 2: plain stats.
  { id: "5", checks: "AP ratio (plain AP item)", level: 11, rRank: 2, items: ["Zhonya's Hourglass"], dummy: plain, measured: [862] },
  { id: "6", checks: "Rabadon's +AP% (compare with 5)", level: 11, rRank: 2, items: ["Zhonya's Hourglass", "Rabadon's Deathcap"], dummy: plain, measured: [1433] },
  { id: "7", checks: "Bonus AD ratio (plain AD item)", level: 11, rRank: 2, items: ["Bloodthirster"], dummy: plain, measured: [921] },
  { id: "8", checks: "Magic penetration (compare with 4 and 5)", level: 11, rRank: 2, items: ["Void Staff"], dummy: { hp: 3000, resist: 50 }, measured: [641] },

  // --- Part 3: on-hit at R's 25 / 30 / 35%.
  { id: "9", checks: "On-hit at rank 1 (25%)", level: 6, rRank: 1, items: ["Nashor's Tooth"], dummy: plain, measured: [704] },
  { id: "10", checks: "On-hit at rank 2 (30%)", level: 11, rRank: 2, items: ["Nashor's Tooth"], dummy: plain, measured: [912] },
  { id: "11", checks: "On-hit at rank 3 (35%)", level: 16, rRank: 3, items: ["Nashor's Tooth"], dummy: plain, measured: [1120] },

  // --- Part 4: coded passives, including the open questions in NOTES.md.
  { id: "12", checks: "Liandry's burn + in-combat amp", level: 11, rRank: 2, items: ["Liandry's Torment"], dummy: plain, measured: [799] },
  { id: "13", checks: "Riftmaker HP ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ AP with Warmog's", level: 16, rRank: 3, items: ["Riftmaker", "Warmog's Armor"], dummy: { hp: 4000, resist: 0 }, measured: [1044] },
  { id: "14", checks: "Luden's Echo (first dagger)", level: 11, rRank: 2, items: ["Luden's Echo"], dummy: plain, measured: [896] },
  { id: "15", checks: "BotRK (reads the dummy's current HP; R before on-hit?)", level: 11, rRank: 2, items: ["Blade of The Ruined King"], dummy: plain, measured: [1696] },
  { id: "16", checks: "Guinsoo's (do daggers give stacks / Phantom Hits?)", level: 11, rRank: 2, items: ["Guinsoo's Rageblade"], dummy: plain, measured: [1065] },

  // ===== Round 2 ===== measured by Eric on Nov 23, 2026 (patch 26.23), one ult each.
  // Stats panel check: level 16 with only Bloodthirster showed 184 AD and 0.919 attack speed,
  // exactly what the calculator uses.
  // --- Part 5: why was test 7 (Bloodthirster) off? Same item at other levels (different bonus attack
  // speed), and a different AD item. If 7a/7b are off by the same SHARE as 7, it's the AD; if the gap
  // grows with level, it's the attack speed part of the formula.
  { id: "7a", checks: "Bloodthirster at level 6 (less bonus attack speed)", level: 6, rRank: 1, items: ["Bloodthirster"], dummy: plain, measured: [649] },
  { id: "7b", checks: "Bloodthirster at level 16 (more bonus attack speed)", level: 16, rRank: 3, items: ["Bloodthirster"], dummy: plain, measured: [1209], hpAfter: [1821] },
  { id: "7c", checks: "Another plain AD item (is it Bloodthirster itself?)", level: 11, rRank: 2, items: ["Death's Dance"], dummy: plain, measured: [832] },

  // --- Part 6: items together (order of on-hit effects, stacks, damage boosts multiplying).
  { id: "17", checks: "Guinsoo's + BotRK: Phantom Hits repeat BotRK", level: 16, rRank: 3, items: ["Guinsoo's Rageblade", "Blade of The Ruined King"], dummy: { hp: 6000, resist: 0 }, measured: [4048], hpAfter: [2003] },
  { id: "18", checks: "Guinsoo's + BotRK + Terminus (Eric's combo)", level: 16, rRank: 3, items: ["Guinsoo's Rageblade", "Blade of The Ruined King", "Terminus"], dummy: { hp: 5000, resist: 50 }, measured: [3317] },
  { id: "19", checks: "Nashor's + Guinsoo's (on-hit Katarina)", level: 16, rRank: 3, items: ["Nashor's Tooth", "Guinsoo's Rageblade"], dummy: { hp: 4000, resist: 0 }, measured: [1862] },
  { id: "20", checks: "Liandry's + Riftmaker: two % boosts together", level: 16, rRank: 3, items: ["Liandry's Torment", "Riftmaker"], dummy: { hp: 4000, resist: 0 }, measured: [1270] },
  // --- Part 7: Eric's "fun experiment" (Nov 23, 2026). Predicted BEFORE casting: 966 HP left.
  // Statikk Shiv fully charged before the ult. Read off the HP bar only (twice).
  {
    id: "22",
    checks: "6-item on-hit combo: BotRK, Guinsoo's, Statikk, Yun Tal, Kraken, Shadowflame",
    level: 16,
    rRank: 3,
    items: ["Blade of The Ruined King", "Guinsoo's Rageblade", "Statikk Shiv", "Yun Tal Wildarrows", "Kraken Slayer", "Shadowflame"],
    dummy: { hp: 10000, resist: 10 },
    measured: [],
    hpAfter: [970, 980],
  },
  { id: "21", checks: "Rabadon's + Luden's: AP % boosting an item's AP ratio", level: 16, rRank: 3, items: ["Rabadon's Deathcap", "Luden's Echo"], dummy: { hp: 4000, resist: 0 }, measured: [1665] },
];
