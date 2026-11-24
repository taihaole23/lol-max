// Tests for scripts/splash-colors.mjs (how a champion's theme colour is picked from the splash).
// Plain JavaScript like the script itself. The tests make tiny fake pictures with jpeg-js.
import { test, expect } from "vitest";
import jpeg from "jpeg-js";
import { pickSplashColor } from "../scripts/splash-colors.mjs";

// A 100×100 .jpg. `colourAt(x, y)` gives each pixel's [r, g, b].
function fakeSplash(colourAt) {
  const width = 100, height = 100;
  const data = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = colourAt(x, y);
      data.set([r, g, b, 255], (y * width + x) * 4);
    }
  }
  return jpeg.encode({ width, height, data }, 95).data;
}

// Hue of "#rrggbb" in degrees, to check WHICH colour came out (jpg changes the exact numbers a bit).
function hueOf(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180) / Math.PI + 360;
}
const hueDistance = (a, b) => Math.min(Math.abs(a - b) % 360, 360 - (Math.abs(a - b) % 360));

test("a black-and-white picture has no colour (the site keeps its normal red)", () => {
  expect(pickSplashColor(fakeSplash((x) => [x * 2, x * 2, x * 2]))).toBeNull();
});

test("a grey picture with a small glowing green patch picks green", () => {
  const green = [60, 220, 90];
  const color = pickSplashColor(fakeSplash((x, y) => (x < 20 && y < 20 ? green : [110, 105, 100])));
  expect(color).not.toBeNull();
  expect(hueDistance(hueOf(color), hueOf("#3cdc5a"))).toBeLessThan(15);
});

test("a big dull brown area loses to a smaller vivid blue one", () => {
  const color = pickSplashColor(fakeSplash((x) => (x < 30 ? [40, 90, 230] : [150, 110, 80])));
  expect(hueDistance(hueOf(color), hueOf("#285ae6"))).toBeLessThan(15);
});
