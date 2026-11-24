// The full item card shown in the tooltip: icon, name, cost, stats, passives / actives, and
// whether the calculator models its passive for this ability.
import type { Item } from "../data/items.ts";
import { itemPassives } from "../items/index.ts";
import { escapeHtml } from "./html.ts";
import { goldHtml, iconPath } from "./icons.ts";

// Stat names as the game writes them. `percent`: stored as a fraction (0.4), shown as "40%".
const statLabels: Record<string, { label: string; percent?: boolean }> = {
  attackDamage: { label: "Attack Damage" },
  abilityPower: { label: "Ability Power" },
  attackSpeed: { label: "Attack Speed", percent: true },
  critChance: { label: "Critical Strike Chance", percent: true },
  critDamage: { label: "Critical Strike Damage", percent: true },
  lethality: { label: "Lethality" },
  percentArmorPenetration: { label: "Armor Penetration", percent: true },
  flatMagicPenetration: { label: "Magic Penetration" },
  percentMagicPenetration: { label: "Magic Penetration", percent: true },
  adaptiveForce: { label: "Adaptive Force" },
  health: { label: "Health" },
  armor: { label: "Armor" },
  magicResist: { label: "Magic Resist" },
  mana: { label: "Mana" },
  abilityHaste: { label: "Ability Haste" },
  lifeSteal: { label: "Life Steal", percent: true },
  omnivamp: { label: "Omnivamp", percent: true },
  moveSpeed: { label: "Move Speed" },
  percentMoveSpeed: { label: "Move Speed", percent: true },
  healAndShieldPower: { label: "Heal and Shield Power", percent: true },
  tenacity: { label: "Tenacity", percent: true },
  baseHealthRegen: { label: "Base Health Regen", percent: true },
  baseManaRegen: { label: "Base Mana Regen", percent: true },
  goldPer10: { label: "Gold per 10 seconds" },
};

export function statLines(item: Item): string[] {
  return Object.entries(item.stats)
    .filter(([, value]) => value !== undefined && value !== 0)
    .map(([key, value]) => {
      const known = statLabels[key];
      const number = known?.percent ? `${Math.round(value! * 1000) / 10}%` : `${value}`;
      return `${number} ${known?.label ?? key}`;
    });
}

const categoryLabels: Record<Item["category"], string> = {
  legendary: "Legendary",
  boots: "Boots",
  "boots-tier-3": "Boots (tier 3)",
  support: "Support",
};

// `note`: an extra line at the bottom (e.g. why the item can't be picked right now).
export function itemCardHtml(item: Item, note?: string): string {
  const modelled = itemPassives.some((p) => p.name === item.name);
  const stats = statLines(item).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const effects = item.effects
    .map(
      (e) => `
        <div class="card-effect">
          <span class="card-effect-name">${escapeHtml(e.name)}</span>
          <span class="card-effect-kind">${e.kind === "active" ? "Active" : "Passive"}</span>
          <p>${escapeHtml(e.text)}</p>
        </div>`,
    )
    .join("");
  const status = modelled
    ? `<p class="card-status modelled">Passive modelled in the calculator</p>`
    : item.effects.some((e) => e.kind === "passive")
      ? `<p class="card-status">Passive doesn't change Death Lotus damage: stats only</p>`
      : "";

  return `
    <div class="item-card">
      <div class="card-head">
        <img src="${iconPath.item(item)}" alt="" width="44" height="44" />
        <div>
          <div class="card-name">${escapeHtml(item.name)}</div>
          <div class="card-meta">${goldHtml(item.gold)} · ${categoryLabels[item.category]}</div>
        </div>
      </div>
      ${stats ? `<ul class="card-stats">${stats}</ul>` : ""}
      ${effects}
      ${status}
      ${note ? `<p class="card-note">${escapeHtml(note)}</p>` : ""}
    </div>`;
}
