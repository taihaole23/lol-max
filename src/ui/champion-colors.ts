// Each champion page takes its accent colour (buttons, highlights, links, the selected ability...)
// from the champion's splash art. scripts/splash-colors.mjs picked one colour per champion from
// the picture; this file turns it into the shades the page needs, for the dark and light theme.
//
// The picked colour can be anything (pale yellow, dark navy...), so it's never used as it is:
// we keep its HUE (which colour it is: red, teal, gold...) and choose the lightness ourselves, so
// the result is always readable. "Readable" is measured with the WCAG contrast ratio, the standard
// web accessibility check: 1 = no difference, 21 = black on white. Normal text needs 4.5 or more;
// shapes like borders and switches need 3 or more.
import { championList } from "../data/champion-list.ts";

// The page backgrounds the accent has to stand out from. The lightest dark surface and the
// darkest light surface are the hardest cases, so passing against them passes against all.
// These must match --panel-hover in style.css: change one, change the other. (Tests can't read
// style.css: Vitest skips CSS files.)
export const DARK_SURFACE = "#1f2738";
export const LIGHT_SURFACE = "#e9ebf0";
export const MIN_TEXT_CONTRAST = 4.5; // links and coloured words
export const MIN_SHAPE_CONTRAST = 3; // borders, switches, rank boxes
// Text ON the accent (the Optimize button): white or near-black, whichever reads better.
const WHITE = "#ffffff";
const NEAR_BLACK = "#0a0d13";
// A greyish splash colour is made more colourful, and a garish one calmer, so every page looks
// like it belongs to the same site.
const MIN_SATURATION = 0.55;
const MAX_SATURATION = 0.9;
// Where the lightness search starts: close to the site's normal red in each theme.
const DARK_START_LIGHTNESS = 0.55;
const LIGHT_START_LIGHTNESS = 0.42;
const STEP = 0.01;

export type AccentTokens = {
  accent: string; // borders, switches, selected things
  accentStrong: string; // links and coloured text, hover
  accentSoft: string; // see-through tint behind a selected card
  bgGlow: string; // faint glow at the top of the page
  onAccent: string; // text on an accent-coloured button
};

// ---- Colour maths ----

type Hsl = { h: number; s: number; l: number }; // h 0-360, s and l 0-1

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexToHsl(hex: string): Hsl {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, "0")).join("");
}

// How bright a colour looks to the eye (WCAG "relative luminance"): green counts most, blue least.
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const rgba = (hex: string, alpha: number) => `rgba(${hexToRgb(hex).join(", ")}, ${alpha})`;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Moves the lightness one step at a time (up = lighter, down = darker) until the colour has
// `needed` contrast against `surface`.
function lightnessFor(base: Hsl, start: number, direction: 1 | -1, surface: string, needed: number): Hsl {
  let l = start;
  while (l > 0 && l < 1 && contrast(hslToHex({ ...base, l }), surface) < needed) l += direction * STEP;
  return { ...base, l: clamp(l, 0, 1) };
}

// Button text: white, like the rest of the site, if it's readable on BOTH the button and its hover
// colour. Otherwise (gold, teal, light green buttons) near-black.
const worst = (text: string, backgrounds: string[]) => Math.min(...backgrounds.map((b) => contrast(text, b)));
const textOn = (...backgrounds: string[]) => (worst(WHITE, backgrounds) >= MIN_SHAPE_CONTRAST ? WHITE : NEAR_BLACK);

// ---- The shades for one splash colour ----

export function accentTokens(splashColor: string): { dark: AccentTokens; light: AccentTokens } {
  const picked = hexToHsl(splashColor);
  const base = { ...picked, s: clamp(picked.s, MIN_SATURATION, MAX_SATURATION) };

  // Dark theme: a dark background, so the accent gets LIGHTER until it stands out.
  const darkAccent = lightnessFor(base, DARK_START_LIGHTNESS, 1, DARK_SURFACE, MIN_SHAPE_CONTRAST);
  const darkStrong = lightnessFor(base, darkAccent.l + 0.06, 1, DARK_SURFACE, MIN_TEXT_CONTRAST);
  // Light theme: a light background, so it gets DARKER. Here even the plain accent is used for
  // text (on white, a shape-only contrast looks washed out), so both need text contrast.
  const lightAccent = lightnessFor(base, LIGHT_START_LIGHTNESS, -1, LIGHT_SURFACE, MIN_TEXT_CONTRAST);
  const lightStrong = lightnessFor(base, lightAccent.l + 0.04, -1, LIGHT_SURFACE, MIN_TEXT_CONTRAST);

  const tokens = (accent: string, strong: string, soft: number, glow: number): AccentTokens => ({
    accent,
    accentStrong: strong,
    accentSoft: rgba(accent, soft),
    bgGlow: rgba(accent, glow),
    onAccent: textOn(accent, strong), // the Optimize button turns accentStrong on hover
  });
  // The see-through amounts are the same as the normal red's in style.css.
  return {
    dark: tokens(hslToHex(darkAccent), hslToHex(darkStrong), 0.14, 0.09),
    light: tokens(hslToHex(lightAccent), hslToHex(lightStrong), 0.1, 0.06),
  };
}

// The CSS that switches the page to these colours. Same variable names as style.css, so every
// rule that uses var(--accent) follows along with no other change.
export function accentCss(splashColor: string): string {
  const { dark, light } = accentTokens(splashColor);
  const block = (t: AccentTokens) =>
    `--accent: ${t.accent}; --accent-strong: ${t.accentStrong}; --accent-soft: ${t.accentSoft}; --bg-glow: ${t.bgGlow}; --on-accent: ${t.onAccent};`;
  return `:root { ${block(dark)} }\n:root[data-theme="light"] { ${block(light)} }`;
}

// ---- Putting it on the page ----

// One <style> tag at the end of <head>, added after style.css so it wins. Called on every page
// change: a champion page fills it, any other page (or a champion with a grey splash) empties it,
// so the site's normal red comes back.
// It runs before the new page is painted, so the colours never flash.
export function applyChampionColors(slug: string | null): void {
  let tag = document.getElementById("champion-colors");
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "champion-colors";
    document.head.append(tag);
  }
  const color = slug ? championList.find((c) => c.slug === slug)?.splashColor : null;
  tag.textContent = color ? accentCss(color) : "";
}
