// Tests for src/ui/champion-colors.ts: every champion page's splash colours must be readable.
import { test, expect } from "vitest";
import { championList } from "../src/data/champion-list.ts";
import {
  accentTokens,
  contrast,
  DARK_SURFACE,
  LIGHT_SURFACE,
  MIN_SHAPE_CONTRAST,
  MIN_TEXT_CONTRAST,
} from "../src/ui/champion-colors.ts";

test("contrast ratio matches the WCAG examples", () => {
  expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 5);
  expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  expect(contrast("#123456", "#123456")).toBe(1);
});

test("almost every champion got a splash colour, written as #rrggbb", () => {
  const colors = championList.map((c) => c.splashColor);
  for (const color of colors) if (color !== null) expect(color).toMatch(/^#[0-9a-f]{6}$/);
  // A few nearly black-and-white splashes keep the normal red. Many more would mean the picker broke.
  expect(colors.filter((c) => c === null).length).toBeLessThanOrEqual(10);
});

test("every champion's colours are readable in both themes", () => {
  for (const c of championList) {
    if (!c.splashColor) continue;
    const { dark, light } = accentTokens(c.splashColor);
    expect(contrast(dark.accent, DARK_SURFACE), `${c.name} dark accent`).toBeGreaterThanOrEqual(MIN_SHAPE_CONTRAST);
    expect(contrast(dark.accentStrong, DARK_SURFACE), `${c.name} dark text`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(contrast(light.accent, LIGHT_SURFACE), `${c.name} light accent`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    expect(contrast(light.accentStrong, LIGHT_SURFACE), `${c.name} light text`).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    // Button text (white or near-black) on the button and on its hover colour.
    for (const t of [dark, light]) {
      expect(contrast(t.onAccent, t.accent), `${c.name} button`).toBeGreaterThanOrEqual(MIN_SHAPE_CONTRAST);
      expect(contrast(t.onAccent, t.accentStrong), `${c.name} button hover`).toBeGreaterThanOrEqual(MIN_SHAPE_CONTRAST);
    }
  }
});

test("the colour stays the same colour: only its lightness and strength change", () => {
  // A teal splash gives a teal page, not some other colour.
  const { dark, light } = accentTokens("#60bcaf");
  for (const shade of [dark.accent, light.accent]) {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(shade.slice(i, i + 2), 16));
    expect(g).toBeGreaterThan(r); // green-blue, not red
    expect(b).toBeGreaterThan(r);
  }
});
