// Builds the HTML for one build's damage breakdowns and for the top-5 list.
// The numbers come from breakdown-rows.ts; this file only decides how they look.
import type { ExplainedBuild, SearchResult } from "../optimizer/messages.ts";
import { buildStyles } from "../optimizer/styles.ts";
import { abilityVsItemRows, marginalRows, sourceRows, typeRows, type Row } from "./breakdown-rows.ts";
import type { Item } from "../data/items.ts";
import type { Breakdown } from "../simulation/breakdown.ts";
import type { CritTotals } from "../simulation/simulate-build.ts";
import { escapeHtml } from "./html.ts";
import { goldHtml, itemIconHtml } from "./icons.ts";
import { sunderedSkyData } from "../items/sundered-sky.ts";

// A row's label, coloured by damage type when it has exactly one (purple magic, orange physical).
function labelHtml(r: Row): string {
  const text = escapeHtml(r.label);
  return r.damageType ? `<span class="dmg-${r.damageType}">${text}</span>` : text;
}

// Whole numbers with thousands separators; a real minus sign for negatives ("−120").
export function formatDamage(damage: number): string {
  const rounded = Math.round(damage);
  const text = Math.abs(rounded).toLocaleString("en-US");
  return rounded < 0 ? `−${text}` : text;
}

export function formatShare(share: number): string {
  const text = `${Math.abs(share * 100).toFixed(1)}%`;
  return share < 0 ? `−${text}` : text;
}

// A thin bar split into coloured parts (damage type, ability vs. items), with a legend that
// names every part and gives its number, so the colours are never the only way to tell them apart.
function splitBar(title: string, rows: Row[], colours: string[]): string {
  const parts = rows
    .map((r, i) => ({ ...r, colour: colours[i] }))
    .filter((r) => r.damage > 0);
  const summary = rows.map((r) => `${r.label} ${formatShare(r.share)}`).join(", ");
  const segments = parts
    .map(
      (r) =>
        `<div class="segment" style="flex-grow:${r.share};background:var(${r.colour})"` +
        ` title="${escapeHtml(r.label)}: ${formatDamage(r.damage)} (${formatShare(r.share)})"></div>`,
    )
    .join("");
  const legend = rows
    .map(
      (r, i) =>
        `<li><span class="swatch" style="background:var(${colours[i]})"></span>${labelHtml(r)}` +
        ` <strong>${formatDamage(r.damage)}</strong> <span class="muted">${formatShare(r.share)}</span></li>`,
    )
    .join("");
  return `
    <div class="split">
      <h3>${title}</h3>
      <div class="split-bar" role="img" aria-label="${escapeHtml(summary)}">${segments}</div>
      <ul class="legend">${legend}</ul>
    </div>`;
}

// A table with one bar per row. Bar length = damage compared with the biggest row.
// A negative row (item interactions) gets no bar, just its number.
function barTable(title: string, firstColumn: string, rows: Row[], note: string): string {
  const biggest = Math.max(...rows.map((r) => Math.abs(r.damage)), 1);
  const body = rows
    .map((r) => {
      const width = r.damage > 0 ? (r.damage / biggest) * 100 : 0;
      return `
        <tr title="${escapeHtml(r.label)}: ${formatDamage(r.damage)} (${formatShare(r.share)})">
          <th scope="row"><span class="row-label">${r.item ? itemIconHtml(r.item, 22) : ""}${labelHtml(r)}</span></th>
          <td class="bar-cell"><div class="bar" style="width:${width}%"></div></td>
          <td class="number">${formatDamage(r.damage)}</td>
          <td class="number muted">${formatShare(r.share)}</td>
        </tr>`;
    })
    .join("");
  return `
    <div class="bar-table">
      <h3>${title}</h3>
      <table>
        <thead><tr><th scope="col">${firstColumn}</th><th scope="col"><span class="visually-hidden">Bar</span></th>
          <th scope="col" class="number">Damage</th><th scope="col" class="number">Share</th></tr></thead>
        <tbody>${body}</tbody>
      </table>
      <p class="hint">${note}</p>
    </div>`;
}

// Ability vs. items: one colour per ability line (one, or one per named hit), then the items' colour.
function abilitySplit(b: Breakdown): string {
  const rows = abilityVsItemRows(b);
  const abilityColours = ["--part-ability", "--part-recast"];
  const colours = [...abilityColours.slice(0, rows.length - 1), "--part-items"];
  return splitBar("Ability vs. items", rows, colours);
}

export const alwaysCrits = (crit: CritTotals) => crit.chance >= 1;
// The hover text on an always-crit number: why it always crits.
export const alwaysCritTitle = (crit: CritTotals) =>
  crit.guaranteedBy ? `Crit (${crit.guaranteedBy} always crits)` : "Crit (100% crit chance)";
// 0% crit chance: Q can never crit, so the crit number would never happen (Eric).
export const neverCrits = (crit: CritTotals) => crit.chance <= 0;

// For an ability that can crit (Yone's Q): "no crit / crit", each in its own colour (Eric).
// Used on the build cards; the big total builds the same two spans itself so it can count up.
export function critPairHtml(crit: CritTotals): string {
  // 100% crit chance: Q always crits, so the no-crit number would never happen (Eric).
  if (alwaysCrits(crit)) return `<span class="crit" title="${alwaysCritTitle(crit)}">${formatDamage(crit.crit)}</span>`;
  if (neverCrits(crit)) return formatDamage(crit.noCrit);
  return (
    `<span class="no-crit" title="No crit">${formatDamage(crit.noCrit)}</span>` +
    // <wbr> = "may break the line here": a narrow phone puts the crit number under the other one
    // instead of pushing the card wider than the screen.
    `<span class="crit-slash">/</span><wbr>` +
    `<span class="crit" title="Crit">${formatDamage(crit.crit)}</span>`
  );
}

// The key for the two colours, above the breakdowns. Builds are ranked by their peak (the crit,
// if the build can crit at all), and the breakdowns show that peak (Eric).
function critHtml(crit: CritTotals): string {
  const chance = `${Math.round(crit.chance * 100)}%`;
  if (crit.guaranteedBy) {
    return `<p class="crit-totals">${crit.guaranteedBy}: Q always crits, for ${Math.round(sunderedSkyData.critDamageRatio * 100)}% of the usual crit damage: <strong class="crit">${formatDamage(crit.crit)}</strong>.</p>`;
  }
  if (alwaysCrits(crit)) {
    return `<p class="crit-totals">100% crit chance: Q always crits, for <strong class="crit">${formatDamage(crit.crit)}</strong>.</p>`;
  }
  if (neverCrits(crit)) {
    return `<p class="crit-totals">0% crit chance: Q can't crit, so it deals <strong>${formatDamage(crit.noCrit)}</strong>.</p>`;
  }
  return `
    <p class="crit-totals">
      <strong class="no-crit">${formatDamage(crit.noCrit)}</strong> without a crit,
      <strong class="crit">${formatDamage(crit.crit)}</strong> with a crit (${chance} crit chance).
      Builds are ranked by the crit, and the breakdowns below show the crit.
    </p>`;
}

export function breakdownHtml(build: ExplainedBuild): string {
  const e = build.explanation;
  return `
    ${e.crit ? critHtml(e.crit) : ""}
    <div class="splits">
      ${splitBar("Damage type", typeRows(e.breakdown), ["--type-magic", "--type-physical", "--type-true"])}
      ${abilitySplit(e.breakdown)}
    </div>
    <div class="bar-tables">
      ${barTable(
        "By source",
        "Source",
        sourceRows(e.breakdown),
        "Where each point of damage came from. Item names cover their on-hit effects and passives (Katarina's R applies on-hit at reduced effectiveness).",
      )}
      ${barTable(
        "What each item adds",
        "Item",
        marginalRows(e),
        "Each item's line = damage with it − damage without it. Items boost each other, so these don't add up on their own; the difference is the \"Item interactions\" line.",
      )}
    </div>`;
}

// Boots first, then the other items: the same order as the item slots.
const isBoots = (item: Item) => item.category === "boots" || item.category === "boots-tier-3";
const slotOrder = (items: Item[]) => [...items.filter(isBoots), ...items.filter((item) => !isBoots(item))];

// What the whole build costs (boots included), from each item's shop price.
export const buildCost = (items: Item[]) => items.reduce((sum, item) => sum + item.gold, 0);

// Every build card has a number (`data-build-index`): 0-4 are the top 5, then one per style.
// This turns the number back into the build (undefined for a style with no build).
export function buildAt(result: SearchResult, index: number): ExplainedBuild | undefined {
  if (index < result.builds.length) return result.builds[index];
  return result.styles[index - result.builds.length]?.build ?? undefined;
}

const sameItems = (a: ExplainedBuild, b: ExplainedBuild) =>
  a.items.length === b.items.length && a.items.every((item) => b.items.some((other) => other.name === item.name));

// One build as a button: rank (or style), damage, item icons (names on hover), cost. Clicking it
// shows the build in the slots and the breakdowns. The label reads it all out for screen readers.
// The icons' size on screen (and the whole card's sizes) come from --icon in style.css. The number
// below only tells the browser the picture's size before the CSS loads: keep the two the same.
function buildCardHtml(build: ExplainedBuild, index: number, selected: number, rank: string, name: string, extra = ""): string {
  const ordered = slotOrder(build.items);
  const crit = build.explanation.crit;
  const damageText = !crit || neverCrits(crit)
    ? `${formatDamage(build.damage)} damage`
    : alwaysCrits(crit)
    ? `${formatDamage(crit.crit)} damage, always a crit`
    : `${formatDamage(crit.noCrit)} damage without a crit, ${formatDamage(crit.crit)} with a crit`;
  const label =
    `${name}: ${damageText}, ${buildCost(build.items).toLocaleString("en-US")} gold, ` +
    ordered.map((item) => item.name).join(", ");
  return `
    <li><button type="button" class="build-card${index === selected ? " selected" : ""}" data-build-index="${index}" aria-label="${escapeHtml(label)}">
      ${rank}
      <span class="build-damage">${crit ? critPairHtml(crit) : formatDamage(build.damage)}</span>
      <span class="build-items">${ordered.map((item) => itemIconHtml(item, 72)).join("")}${extra}</span>
      ${goldHtml(buildCost(build.items))}
    </button></li>`;
}

// The top 5, then the best build of each style (every item gives AP / AD / attack speed).
export function topBuildsHtml(result: SearchResult, selected: number): string {
  const top = result.builds
    .map((build, i) => buildCardHtml(build, i, selected, `<span class="build-rank">#${i + 1}</span>`, `Build ${i + 1}`))
    .join("");

  const styleCards = result.styles
    .map(({ style, build }, i) => {
      const info = buildStyles.find((s) => s.key === style)!;
      const tag = `<span class="build-rank style-${style}" data-tip="${escapeHtml(`Best build where every item gives ${info.label.toLowerCase()} (boots aside)`)}">${info.short}</span>`;
      if (!build) {
        return `<li><div class="build-card empty">${tag}<span class="muted">No ${info.label.toLowerCase()} build fits these slots, locks and bans.</span></div></li>`;
      }
      const sameAs = result.builds.findIndex((b) => sameItems(b, build));
      const note = sameAs >= 0 ? `<span class="same-as">same as #${sameAs + 1}</span>` : "";
      return buildCardHtml(build, result.builds.length + i, selected, tag, `Best ${info.label.toLowerCase()} build`, note);
    })
    .join("");

  return `
    <ol class="top-builds">${top}</ol>
    <h3 class="styles-title">Best build for each stat <span class="field-hint">Every item gives that stat (boots aside)</span></h3>
    <ul class="top-builds style-builds">${styleCards}</ul>`;
}
