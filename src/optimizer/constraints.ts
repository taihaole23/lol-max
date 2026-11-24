// The user's conditions on a build: items it MUST have (locked into a slot) and items it must NOT
// have (banned). The search follows them; this file checks they make sense.
import { getItem } from "../data/items.ts";
import { canBeBuiltTogether } from "./legal.ts";
import { bootsPool, legendaryPool, type BootsSetting } from "./item-pool.ts";
import { panelStatInfo, type MinStats, type PanelStat } from "../stats/stat-panel.ts";

export type BuildConstraints = {
  required: string[]; // legendary items that must be in the build
  requiredBoots: string | null; // boots that must be in the build
  banned: string[]; // items (legendary or boots) that must not be
  // Stats the finished build must reach, as the stat panel shows them (stat-panel.ts),
  // e.g. { abilityPower: 150, attackDamage: 150 }. Left out = no minimums.
  minStats?: MinStats;
  // Stats to MAXIMIZE instead of damage, e.g. ["abilityPower", "attackDamage"]. Several are
  // balanced: see search.ts. Left out or empty = rank by damage.
  maximize?: PanelStat[];
};

export const noConstraints: BuildConstraints = { required: [], requiredBoots: null, banned: [], minStats: {}, maximize: [] };

// Every legendary a (melee) champion can buy, INCLUDING ones the speed filter leaves out of the search:
// a user may still lock Frozen Heart in on purpose.
export const lockableLegendaries = () => legendaryPool(false).legendaries;

// What's wrong with these conditions, in plain words, or null if they're fine.
// The page shows the message; the search refuses to run on anything but null.
export function constraintProblem(c: BuildConstraints, boots: BootsSetting, itemCount: number): string | null {
  const allowed = new Set(lockableLegendaries().map((i) => i.name));
  const banned = new Set(c.banned);

  if (new Set(c.required).size !== c.required.length) return "The same item is locked in twice.";
  if (c.required.length > itemCount) return `${c.required.length} items are locked in, but there are only ${itemCount} item slots.`;
  for (const name of c.required) {
    if (!allowed.has(name)) return `${name} isn't a completed item a melee champion can buy.`;
    if (banned.has(name)) return `${name} is both locked in and banned.`;
  }
  for (let a = 0; a < c.required.length; a++) {
    for (let b = a + 1; b < c.required.length; b++) {
      if (!canBeBuiltTogether(c.required[a], c.required[b])) return `${c.required[a]} and ${c.required[b]} can't be built together.`;
    }
  }

  if (c.requiredBoots !== null) {
    if (boots === "off") return "Boots are locked in, but boots are turned off.";
    if (!bootsPool(boots).some((i) => i.name === c.requiredBoots)) {
      return `${c.requiredBoots} doesn't fit this boots setting (${boots === "tier3" ? "tier-3" : "tier-2"} boots).`;
    }
    if (banned.has(c.requiredBoots)) return `${c.requiredBoots} is both locked in and banned.`;
    for (const name of c.required) {
      if (!canBeBuiltTogether(c.requiredBoots, name)) return `${c.requiredBoots} and ${name} can't be built together.`;
    }
  }

  for (const name of c.banned) getItem(name); // throws on a typo: a ban must name a real item

  for (const [stat, min] of Object.entries(c.minStats ?? {})) {
    const info = panelStatInfo.find((s) => s.key === stat);
    if (!info) throw new Error(`No stat called "${stat}".`); // a bug in the page, not the user's typing
    if (!Number.isFinite(min) || min < 0) return `The minimum ${info.label} must be a number, 0 or more.`;
  }
  for (const stat of c.maximize ?? []) {
    if (!panelStatInfo.some((s) => s.key === stat)) throw new Error(`No stat called "${stat}".`);
  }
  return null;
}
