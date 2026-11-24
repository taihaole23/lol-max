// Picks each champion's theme colour from their saved splash art, and writes it into the
// champion list as `splashColor`. The champion page then colours its buttons, highlights and
// links with it (src/ui/champion-colors.ts turns the one colour into readable dark/light shades).
//
// update-icons.mjs runs this at the end by itself. You can also run it alone, e.g. to try a
// different way of picking colours without downloading everything again:
//   node scripts/splash-colors.mjs
//
// jpeg-js reads the pixels of a .jpg (Node can't by itself). It's a dev dependency: only this
// script uses it, the website never loads it.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import jpeg from "jpeg-js";

// How the colour is picked:
//   1. Look at ~20,000 pixels spread over the picture (every pixel would be slower, same answer).
//   2. Skip greys, near-blacks and near-whites: only clearly coloured pixels count.
//      "Chroma" = how far a pixel is from grey (0 = grey, 1 = pure colour).
//   3. Sort them into 36 hue buckets (red, orange, yellow... 10° of the colour wheel each).
//      A pixel counts chroma³: a vivid pixel counts far more than a dull one, so a small glowing
//      accent (Aurora's green magic) beats a big brownish background. (Tried chroma and chroma²
//      too: they picked skin and background tones.)
//   4. The winning bucket, together with its two neighbours (so a colour sitting on a bucket's
//      edge isn't split in half), is the splash's main colour. Its average is the answer.
const SAMPLES = 20_000;
const MIN_CHROMA = 0.3;
const MIN_LIGHTNESS = 0.15;
const MAX_LIGHTNESS = 0.85;
const BUCKETS = 36;
// If fewer than this share of the pixels are colourful (a nearly black-and-white splash), give
// up and let the site use its normal red.
const MIN_COLOURFUL_SHARE = 0.005;

// When the picked colour looks wrong for a champion, set it by hand here: slug → "#rrggbb".
// (Like splashOverrides in update-icons.mjs.)
const colorOverrides = {};

const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

// Returns "#rrggbb", or null when the picture has too little colour.
export function pickSplashColor(jpegBytes) {
  const { width, height, data } = jpeg.decode(jpegBytes, { useTArray: true }); // data = r,g,b,a, r,g,b,a...
  const pixelCount = width * height;
  const stride = Math.max(1, Math.floor(pixelCount / SAMPLES));

  const buckets = Array.from({ length: BUCKETS }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
  let sampled = 0;
  let colourful = 0;
  for (let p = 0; p < pixelCount; p += stride) {
    sampled++;
    const r = data[p * 4], g = data[p * 4 + 1], b = data[p * 4 + 2];
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const chroma = max - min;
    const lightness = (max + min) / 2;
    if (chroma < MIN_CHROMA || lightness < MIN_LIGHTNESS || lightness > MAX_LIGHTNESS) continue;
    colourful++;

    // Hue in degrees (0 = red, 120 = green, 240 = blue), the standard formula.
    const R = r / 255, G = g / 255, B = b / 255;
    let hue;
    if (max === R) hue = 60 * (((G - B) / chroma) % 6);
    else if (max === G) hue = 60 * ((B - R) / chroma + 2);
    else hue = 60 * ((R - G) / chroma + 4);
    if (hue < 0) hue += 360;

    const bucket = buckets[Math.floor(hue / (360 / BUCKETS)) % BUCKETS];
    const weight = chroma ** 3;
    bucket.weight += weight;
    bucket.r += r * weight;
    bucket.g += g * weight;
    bucket.b += b * weight;
  }
  if (colourful < sampled * MIN_COLOURFUL_SHARE) return null;

  // Each bucket together with its neighbours (the wheel wraps: bucket 35 is next to bucket 0).
  const group = (i) => [buckets[(i + BUCKETS - 1) % BUCKETS], buckets[i], buckets[(i + 1) % BUCKETS]];
  let best = 0;
  let bestWeight = -1;
  for (let i = 0; i < BUCKETS; i++) {
    const weight = group(i).reduce((sum, bk) => sum + bk.weight, 0);
    if (weight > bestWeight) [best, bestWeight] = [i, weight];
  }
  const sum = group(best).reduce((s, bk) => ({ r: s.r + bk.r, g: s.g + bk.g, b: s.b + bk.b }), { r: 0, g: 0, b: 0 });
  return toHex(sum.r / bestWeight, sum.g / bestWeight, sum.b / bestWeight);
}

// Adds `splashColor` to every champion in the champion list file, from public/icons/splash/.
export function addSplashColors(listFile) {
  const list = JSON.parse(readFileSync(listFile, "utf8"));
  const grey = [];
  for (const c of list.champions) {
    c.splashColor = colorOverrides[c.slug] ?? (c.splash ? pickSplashColor(readFileSync(`public/icons/splash/${c.slug}.jpg`)) : null);
    if (!c.splashColor) grey.push(c.name);
  }
  writeFileSync(listFile, JSON.stringify(list, null, 2) + "\n");
  if (grey.length) console.warn(`No clear splash colour (the page uses the normal red) for: ${grey.join(", ")}`);
  console.log(`Splash colours added to ${listFile}`);
}

// Run on its own: use the champion list for the site's current patch.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const patch = readFileSync("src/data/patch.ts", "utf8").match(/PATCH\s*=\s*"([^"]+)"/)[1];
  addSplashColors(`src/data/champion-list.${patch}.json`);
}
