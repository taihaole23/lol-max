// The Practice Tool's target dummy, for the in-game validation tests (Step 8).
// Only the tests use this; the site's dummies are real champions (champions.ts).
import { PATCH } from "./patch.ts";

export const practiceDummy = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Practice_Tool", patch: PATCH },
  // "Health 1000, armor 0, magic resist 0" before any cheats.
  baseHp: 1000,
  baseArmor: 0,
  baseMagicResist: 0,
  // Cheat menu steps (enemy dummy only): Ctrl+Shift+T = +100 max HP, Ctrl+Shift+G = +10 resistances.
  hpStep: 100,
  resistStep: 10,
  // "After 3 seconds of not taking damage ... the damage tracking is reset and the dummy health is restored to full."
  resetSeconds: 3,
  // "A dummy can take a maximum of (100% of target dummy's maximum health - 1) damage", so its
  // damage counter under-reports any ult that would kill it. Tests keep the expected damage below
  // this share of its HP, to stay clear of that.
  safeShareOfHp: 0.8,
};
