// "Build styles" (Eric): besides the overall top 5, the best build where EVERY item gives one stat.
// It answers the site's founding question (is AP, AD or attack-speed Katarina the biggest ult?)
// even when one style wins the whole top 5.
//
// How it works: the same search, with every item that doesn't give the stat added to the bans.
// - Boots are left alone: they have their own slot and every style can use any boots.
// - The user's locked items stay locked even if they don't give the stat (their choice wins).
import type { Item } from "../data/items.ts";
import type { PlayableChampionId } from "../data/playable-champions.ts";
import { lockableLegendaries, noConstraints, type BuildConstraints } from "./constraints.ts";

export type StyleKey = "ap" | "ad" | "attackSpeed";

export const buildStyles: { key: StyleKey; label: string; stat: string; short: string }[] = [
  { key: "ap", label: "Ability power", short: "AP", stat: "abilityPower" },
  { key: "ad", label: "Attack damage", short: "AD", stat: "attackDamage" },
  { key: "attackSpeed", label: "Attack speed", short: "AS", stat: "attackSpeed" },
];

export const givesStat = (item: Item, stat: string) => (item.stats[stat] ?? 0) > 0;

// The user's conditions plus "ban every legendary that doesn't give this stat".
export function styleConstraints(style: StyleKey, constraints: BuildConstraints = noConstraints, champion?: PlayableChampionId): BuildConstraints {
  const stat = buildStyles.find((s) => s.key === style)!.stat;
  const banned = new Set(constraints.banned);
  for (const item of lockableLegendaries(champion)) {
    if (!givesStat(item, stat) && !constraints.required.includes(item.name)) banned.add(item.name);
  }
  return { ...constraints, banned: [...banned] };
}
