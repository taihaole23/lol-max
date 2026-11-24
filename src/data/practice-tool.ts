// The Practice Tool's target dummy, for the in-game validation tests (Step 8).
// Only the tests use this; the site's dummies are real champions (champions.ts).

export const practiceDummy = {
  source: { url: "https://wiki.leagueoflegends.com/en-us/Practice_Tool", patch: "26.23" },
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
  // Tests read only off the HP bar don't need that room for the counter: the dummy just has to
  // stay clearly above 1 HP, so its HP bar still shows the real damage.
  hpBarSafeShareOfHp: 0.95,
  // MEASURED (Step 8, patch 26.23), not on the wiki: the "total damage" counter shows one of
  // R's physical hits MORE than the dummy really took. Test 7b (Bloodthirster): 15 physical hits of
  // 28 and 15 magic of 50 on screen, HP bar 3000 → 1821 (1179 lost, calculator 1180), but the
  // counter said 1209. Magic-only tests are exact on the counter. So with physical damage, the
  // HP bar is the reliable reading; counter readings are compared with this added on.
  counterExtraRPhysicalHits: 1,
};
