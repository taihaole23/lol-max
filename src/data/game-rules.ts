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

// Our own rules for the simulation, not Riot's (see CLAUDE.md), so no wiki source.
export const simulationRules = {
  // Overkill rule: the dummy never dies. Its HP stops here, and later hits still count in full.
  minimumHp: 1,
};
