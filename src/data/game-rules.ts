// Numbers that apply to every champion, not just Katarina.
import { PATCH } from "./patch.ts";

const WIKI = "https://wiki.leagueoflegends.com/en-us/";

// How stats grow per level:
//   stat = base + growth × (level − 1) × (constant + perLevel × (level − 1))
// Attack speed uses the same formula, but its growth counts as BONUS attack speed.
export const statGrowth = {
  source: { url: WIKI + "Champion_statistic", patch: PATCH },
  constant: 0.7025,
  perLevel: 0.0175,
};

// How armor and magic resist reduce damage:
//   resist ≥ 0:  damage × 100 / (100 + resist)
//   resist < 0:  damage × (2 − 100 / (100 − resist))
// The same formula is used for armor (physical damage) and MR (magic damage).
export const resistance = {
  source: { url: WIKI + "Armor", patch: PATCH },
  formulaConstant: 100,
};

// The champion levels at which an ultimate (R) can be learned / ranked up: rank 1, 2, 3.
export const ultimateRanks = {
  source: { url: WIKI + "Champion_ability", patch: PATCH },
  levels: [6, 11, 16],
};

// The highest champion level. Rod of Ages' extra level can't go past it.
export const championLevels = {
  source: { url: WIKI + "Experience_(champion)", patch: PATCH },
  max: 18,
};

// Adaptive force gives bonus AD or AP, whichever of the two is higher (wiki: Adaptive force).
// 1 point of adaptive force = 0.6 bonus AD, or 1 AP.
export const adaptiveForce = {
  source: { url: WIKI + "Adaptive_force", patch: PATCH },
  adPerPoint: 0.6,
  apPerPoint: 1,
};

// Move speed: (base + flat bonuses) × (1 + sum of % bonuses), then soft caps:
//   the part between 415 and 490 counts 80%, the part above 490 counts 50%.
// (There are also caps below 220, but nothing in this project slows Katarina.)
export const moveSpeed = {
  source: { url: WIKI + "Movement_speed", patch: PATCH },
  firstCapAt: 415,
  firstCapKeeps: 0.8,
  secondCapAt: 490,
  secondCapKeeps: 0.5,
};

// Our own rules for the simulation, not Riot's (see CLAUDE.md), so no wiki source.
export const simulationRules = {
  // Overkill rule: the dummy never dies. Its HP stops here, and later hits still count in full.
  minimumHp: 1,
};
