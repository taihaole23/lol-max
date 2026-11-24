// Numbers that apply to every champion, not just Katarina.

const WIKI = "https://wiki.leagueoflegends.com/en-us/";

// How stats grow per level:
//   stat = base + growth × (level − 1) × (constant + perLevel × (level − 1))
// Attack speed uses the same formula, but its growth counts as BONUS attack speed.
export const statGrowth = {
  source: { url: WIKI + "Champion_statistic", patch: "26.23" },
  constant: 0.7025,
  perLevel: 0.0175,
};

// How armor and magic resist reduce damage:
//   resist ≥ 0:  damage × 100 / (100 + resist)
//   resist < 0:  damage × (2 − 100 / (100 − resist))
// The same formula is used for armor (physical damage) and MR (magic damage).
export const resistance = {
  source: { url: WIKI + "Armor", patch: "26.23" },
  formulaConstant: 100,
};

// The champion levels at which an ultimate (R) can be learned / ranked up: rank 1, 2, 3.
export const ultimateRanks = {
  source: { url: WIKI + "Champion_ability", patch: "26.23" },
  levels: [6, 11, 16],
};

// The champion levels at which a basic ability (Q, W, E) can reach rank 1, 2, 3, 4, 5.
// So at level 6 a basic ability can be at most rank 3.
export const basicAbilityRanks = {
  source: { url: WIKI + "Champion_ability", patch: "26.23" },
  levels: [1, 3, 5, 7, 9],
};

// A champion gets one skill point per level, so the ranks of all 4 abilities add up to at most the level.
export const skillPoints = {
  source: { url: WIKI + "Champion_ability", patch: "26.23" },
  perLevel: 1,
};

// The highest champion level. Rod of Ages' extra level can't go past it.
export const championLevels = {
  source: { url: WIKI + "Experience_(champion)", patch: "26.23" },
  max: 18,
};

// A champion has 6 item slots (boots take one of them). The trinket slot doesn't count.
export const inventory = {
  source: { url: WIKI + "Item", patch: "26.23" },
  slots: 6,
};

// Critical strike chance can't go above 100%.
// A critical strike deals 200% of the normal damage by default ("It would later be reverted to 200%
// again in V26.01"). Crit damage items (Infinity Edge +30%) ADD to the 200%.
export const criticalStrike = {
  source: { url: WIKI + "Critical_strike", patch: "26.23" },
  maxChance: 1,
  baseDamage: 2,
};

// Adaptive force gives bonus AD or AP, whichever of the two is higher (wiki: Adaptive force).
// 1 point of adaptive force = 0.6 bonus AD, or 1 AP.
export const adaptiveForce = {
  source: { url: WIKI + "Adaptive_force", patch: "26.23" },
  adPerPoint: 0.6,
  apPerPoint: 1,
};

// Move speed: (base + flat bonuses) × (1 + sum of % bonuses), then soft caps:
//   the part between 415 and 490 counts 80%, the part above 490 counts 50%.
// (There are also caps below 220, but nothing in this project slows Katarina.)
export const moveSpeed = {
  source: { url: WIKI + "Movement_speed", patch: "26.23" },
  firstCapAt: 415,
  firstCapKeeps: 0.8,
  secondCapAt: 490,
  secondCapKeeps: 0.5,
};

// Our own rules for the simulation, not Riot's (see CLAUDE.md), so no wiki source.
export const simulationRules = {
  // Overkill rule: the dummy never dies. Its HP stops here, and later hits still count in full.
  minimumHp: 1,
  // Damage window for one-hit abilities (Q, E), in seconds after the hit (Eric: count item effects
  // "for as long as items need"). Every modelled effect one hit can start is over by then: burns
  // (Liandry's, Blackfire) last 3 s, Luden's leftovers 1.25 s, Stormsurge's strike 2 s.
  // The exception is Immolate (Sunfire, Hollow Radiance): the wiki says its own damage keeps it
  // burning forever, so it needs a cut-off, and this is it.
  oneHitWindowSeconds: 3,
};
