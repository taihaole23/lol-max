// Builds the HTML for one build's damage breakdowns and for the top-5 list.
// The numbers come from breakdown-rows.ts; this file only decides how they look.
import type { ExplainedBuild } from "../optimizer/messages.ts";
import { abilityVsItemRows, marginalRows, sourceRows, typeRows, type Row } from "./breakdown-rows.ts";
import type { Item } from "../data/items.ts";
import { escapeHtml } from "./html.ts";
import { iconPath, itemIconHtml } from "./icons.ts";

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
        `<li><span class="swatch" style="background:var(${colours[i]})"></span>${escapeHtml(r.label)}` +
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
          <th scope="row"><span class="row-label">${r.item ? `<img src="${iconPath.item(r.item)}" alt="" width="20" height="20" loading="lazy" />` : ""}${escapeHtml(r.label)}</span></th>
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

export function breakdownHtml(build: ExplainedBuild): string {
  const e = build.explanation;
  return `
    <div class="splits">
      ${splitBar("Damage type", typeRows(e.breakdown), ["--type-magic", "--type-physical", "--type-true"])}
      ${splitBar("Ability vs. items", abilityVsItemRows(e.breakdown), ["--part-ability", "--part-items"])}
    </div>
    <div class="bar-tables">
      ${barTable(
        "By source",
        "Source",
        sourceRows(e.breakdown),
        "Where each point of damage came from. Item names cover their on-hit effects and passives (on-hit at R's reduced effectiveness).",
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

// The top 5, as buttons: rank, damage, then the item icons (names on hover). Clicking one shows
// it in the slots and the breakdowns. The button's label reads the names out for screen readers.
export function topBuildsHtml(builds: ExplainedBuild[], selected: number): string {
  const cards = builds
    .map((build, i) => {
      const ordered = slotOrder(build.items);
      const label = `Build ${i + 1}: ${formatDamage(build.damage)} damage, ${ordered.map((item) => item.name).join(", ")}`;
      return `
        <li><button type="button" class="build-card${i === selected ? " selected" : ""}" data-build-index="${i}" aria-label="${escapeHtml(label)}">
          <span class="build-rank">#${i + 1}</span>
          <span class="build-damage">${formatDamage(build.damage)}</span>
          <span class="build-items">${ordered.map((item) => itemIconHtml(item, 36)).join("")}</span>
        </button></li>`;
    })
    .join("");
  return `<ol class="top-builds">${cards}</ol>`;
}
