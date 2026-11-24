// Small hand-drawn icons for the stat tiles (minimums and Max). Plain SVG lines in `currentColor`,
// so each tile's CSS colours its icon (--stat-ap, --stat-health... in style.css). They're our own
// drawings, not Riot's, so nothing is downloaded. Same style as the theme toggle's sun and moon.
import type { PanelStat } from "../stats/stat-panel.ts";

// The inside of each 24 × 24 icon.
const shapes: Record<PanelStat, string> = {
  // A heart
  health: `<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>`,
  // A shield
  armor: `<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><path d="M12 7v10"/>`,
  // A shield with a rune in it
  magicResist: `<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z"/><circle cx="12" cy="11.5" r="2.5"/>`,
  // A sword
  attackDamage: `<path d="M20 4l-1 4.5-8.5 8.5-3.5-3.5L15.5 5 20 4Z"/><path d="M5 12l7 7"/><path d="M7.5 16.5L4 20"/>`,
  // A four-point sparkle
  abilityPower: `<path d="M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z"/>`,
  // Two chevrons: fast
  attackSpeed: `<path d="M5 6l6 6-6 6"/><path d="M13 6l6 6-6 6"/>`,
  // A crosshair
  critChance: `<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1" fill="currentColor"/>`,
  // An hourglass
  abilityHaste: `<path d="M7 3h10M7 21h10"/><path d="M8 3c0 5 8 5 8 9s-8 4-8 9"/><path d="M16 3c0 5-8 5-8 9s8 4 8 9"/>`,
  // A boot with speed lines
  moveSpeed: `<path d="M9 4h4v7l5.5 2.5A2.5 2.5 0 0 1 20 15.8V18H9V4Z"/><path d="M2 9h4M3 13h3"/>`,
};

export function statIconHtml(stat: PanelStat): string {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[stat]}</svg>`;
}
