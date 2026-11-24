// Every source the site's numbers come from, grouped for the "Sources" section on the page.
// Built from the `source` fields in the data files, so a new data file only needs adding here once,
// and a link can't be shown on the site without also being the one the numbers came from.
import { championListSource, skinTierSource } from "./champion-list.ts";
import { champions } from "./champions.ts";
import * as gameRules from "./game-rules.ts";
import { itemGroups, meleeCannotBuy } from "./item-groups.ts";
import { itemSource } from "./items.ts";
import { akali } from "./akali.ts";
import { katarina } from "./katarina.ts";
import { yone } from "./yone.ts";
import { itemPassives } from "../items/index.ts";

export type Source = { label: string; url: string; patch: string };
export type SourceGroup = { title: string; sources: Source[] };

const named = (label: string, source: { url: string; patch: string }): Source => ({ label, ...source });

// Removes repeated links (Katarina's numbers all come from her one wiki page).
function unique(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => !seen.has(s.url) && seen.add(s.url));
}

export const sourceGroups: SourceGroup[] = [
  {
    title: "Katarina",
    sources: unique([
      named("Katarina: stats, abilities, Death Lotus, Bouncing Blade, Shunpo", katarina.baseStats.source),
      named("Katarina", katarina.deathLotus.source),
      named("Katarina", katarina.bouncingBlade.source),
      named("Katarina", katarina.shunpo.source),
      named("Katarina", katarina.abilities.source),
      named("Katarina", katarina.adaptiveType.source),
      named("Katarina", katarina.rangeType.source),
    ]),
  },
  {
    title: "Akali",
    sources: unique([
      named("Akali: stats, abilities", akali.baseStats.source),
      named("Akali", akali.abilities.source),
      named("Akali", akali.adaptiveType.source),
      named("Akali", akali.rangeType.source),
      named("Five Point Strike (Q)", akali.fivePointStrike.source),
      named("Shuriken Flip (E)", akali.shurikenFlip.source),
      named("Perfect Execution (R)", akali.perfectExecution.source),
    ]),
  },
  {
    title: "Yone",
    sources: unique([
      named("Yone: stats, abilities", yone.baseStats.source),
      named("Yone", yone.abilities.source),
      named("Yone", yone.adaptiveType.source),
      named("Yone", yone.rangeType.source),
      named("Way of the Hunter (passive: crits)", yone.critPassive.source),
      named("Mortal Steel (Q)", yone.mortalSteel.source),
      named("Spirit Cleave (W)", yone.spiritCleave.source),
      named("Fate Sealed (R)", yone.fateSealed.source),
    ]),
  },
  {
    title: "Game rules",
    sources: unique([
      named("Stat growth per level", gameRules.statGrowth.source),
      named("Armor and magic resist", gameRules.resistance.source),
      named("Ability ranks by level and skill points", gameRules.ultimateRanks.source),
      named("Ability ranks by level and skill points", gameRules.basicAbilityRanks.source),
      named("Ability ranks by level and skill points", gameRules.skillPoints.source),
      named("Level cap", gameRules.championLevels.source),
      named("Item slots", gameRules.inventory.source),
      named("Critical strike", gameRules.criticalStrike.source),
      named("Adaptive force", gameRules.adaptiveForce.source),
      named("Move speed", gameRules.moveSpeed.source),
      named("Attack speed", gameRules.attackSpeed.source),
    ]),
  },
  {
    title: "Target dummy champions",
    sources: Object.values(champions).map((c) => named(c.name, c.source)),
  },
  {
    title: "Items",
    sources: [
      named("Item stats (Riot's Data Dragon, saved snapshot)", itemSource),
      named("Champion list, abilities, icons and splash art (Riot's Data Dragon, saved copies)", championListSource),
      named("Skin tiers, to pick each champion's splash art (CommunityDragon)", skinTierSource),
      named("Item groups (\"only one of these\" rules)", itemGroups.source),
      named("Ranged-only items (melee champions can't buy them)", meleeCannotBuy.source),
    ],
  },
  {
    title: "Item passives (one wiki page per hand-coded item)",
    sources: unique([...itemPassives].sort((a, b) => a.name.localeCompare(b.name)).map((p) => named(p.name, p.source))),
  },
];
