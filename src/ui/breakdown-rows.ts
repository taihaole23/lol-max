// Turns one build's explanation into the rows the site shows: label, damage and share of the total.
// No page code here, so the tests can check that every breakdown adds up to the build's total.
import type { BuildExplanation } from "../optimizer/explain.ts";
import type { Breakdown } from "../simulation/breakdown.ts";

export type Row = {
  label: string;
  damage: number;
  share: number; // damage / total: 0.25 = 25%. Can be negative for "Item interactions".
};

// The ability's own sources, in a fixed order. Every other source is an item's name.
const abilitySourceLabels: Record<string, string> = {
  base: "Base damage",
  apRatio: "AP ratio",
  bonusAdRatio: "Bonus AD ratio",
};

function row(label: string, damage: number, total: number): Row {
  return { label, damage, share: total === 0 ? 0 : damage / total };
}

// By source: the ability's parts first (base, AP ratio, bonus AD ratio), then each item's
// effects (on-hit, passives, burns...) from biggest to smallest. Sources that did 0 are left out.
export function sourceRows(b: Breakdown): Row[] {
  const ability = Object.keys(abilitySourceLabels)
    .filter((source) => (b.bySource[source] ?? 0) !== 0)
    .map((source) => row(abilitySourceLabels[source], b.bySource[source], b.total));
  const items = Object.entries(b.bySource)
    .filter(([source, damage]) => !(source in abilitySourceLabels) && damage !== 0)
    .sort(([, a], [, z]) => z - a)
    .map(([source, damage]) => row(source, damage, b.total));
  return [...ability, ...items];
}

// Each item's marginal damage (build with it − build without it), biggest first, between
// "No items" and the "Item interactions" leftover, so the rows add up to the total.
export function marginalRows(e: BuildExplanation): Row[] {
  const total = e.breakdown.total;
  const items = [...e.marginal].sort((a, z) => z.damage - a.damage).map((m) => row(m.item.name, m.damage, total));
  return [row("No items", e.noItemsDamage, total), ...items, row("Item interactions", e.interactions, total)];
}

// Magic / physical / true. All three are always listed (0 is useful to know).
export function typeRows(b: Breakdown): Row[] {
  return [row("Magic", b.byType.magic, b.total), row("Physical", b.byType.physical, b.total), row("True", b.byType.true, b.total)];
}

// The daggers themselves vs. everything item effects added.
export function abilityVsItemRows(b: Breakdown): Row[] {
  return [row("Ability (daggers)", b.ability, b.total), row("Item effects", b.items, b.total)];
}
