/**
 * Regenerates every derived brand asset from `brand/logo-source.png`.
 *
 *   node scripts/generate-logo-assets.mjs
 *
 * Outputs: public/logo.png, app/icon.png, app/apple-icon.png, app/favicon.ico
 * and app/og-logo.ts. Run it after replacing the source artwork; the results
 * are committed, so this is not part of the build.
 *
 * The source is a square mark sitting on a white photographic background, so
 * the work is: find the mark, square it up, knock the white corners out, and
 * emit the sizes each platform wants.
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "brand/logo-source.png");

const src = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: SW, height: SH, channels: C } = src.info;
const px = (x, y) => {
  const i = (y * SW + x) * C;
  return [src.data[i], src.data[i + 1], src.data[i + 2]];
};
const bg = ([r, g, b]) => r > 245 && g > 245 && b > 245;

// Count non-background pixels per row and column. Going via counts rather than
// a first-hit scan means a stray compression speck can be thresholded away
// instead of silently inflating the bounding box.
const rowHas = [];
for (let y = 0; y < SH; y++) {
  let n = 0;
  for (let x = 0; x < SW; x++) if (!bg(px(x, y))) n++;
  rowHas.push(n);
}
const colHas = [];
for (let x = 0; x < SW; x++) {
  let n = 0;
  for (let y = 0; y < SH; y++) if (!bg(px(x, y))) n++;
  colHas.push(n);
}
const NOISE = 4;
const y0 = rowHas.findIndex((n) => n > NOISE);
const y1 = rowHas.length - 1 - [...rowHas].reverse().findIndex((n) => n > NOISE);
const x0 = colHas.findIndex((n) => n > NOISE);
const x1 = colHas.length - 1 - [...colHas].reverse().findIndex((n) => n > NOISE);
const bw = x1 - x0 + 1;
const bh = y1 - y0 + 1;
console.log(`bbox ${bw}x${bh} at (${x0},${y0})  skew=${Math.abs(bw - bh)}px`);

const tight = await sharp(SRC).extract({ left: x0, top: y0, width: bw, height: bh }).png().toBuffer();
const t = await sharp(tight).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const q = (x, y) => {
  const i = (y * bw + x) * t.info.channels;
  return [t.data[i], t.data[i + 1], t.data[i + 2]];
};

// Sampled just inside the left edge at mid height: inside the squircle, clear
// of the paw.
const teal = q(Math.round(bw * 0.06), Math.round(bh * 0.5));
const hex = "#" + teal.map((v) => v.toString(16).padStart(2, "0")).join("");
console.log("brand teal:", hex);

// Corner radius, read two independent ways on the tight crop — the inset along
// the top row, and the depth at which the left column turns teal. On a correct
// crop both edges touch the mark, so a disagreement means the crop is wrong and
// the mask would deform the logo (an over-large radius turns it into a circle).
let a = 0;
while (a < bw && bg(q(a, 0))) a++;
let b = 0;
while (b < bh && bg(q(0, b))) b++;
console.log(`radius: top-row=${a}  left-col=${b}`);
if (Math.abs(a - b) > Math.max(bw, bh) * 0.05) {
  throw new Error(`radius reads disagree (${a} vs ${b}) — the crop is wrong, refusing to mask`);
}
const radius = Math.round((a + b) / 2);

// Knock the corners out with a rounded-rect alpha mask. A global
// white -> transparent would also erase the paw, which is white too.
const mask = Buffer.from(
  `<svg width="${bw}" height="${bh}"><rect width="${bw}" height="${bh}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
);
const masked = await sharp(tight)
  .ensureAlpha()
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toBuffer();

// `fill` squares up the couple-of-percent scan skew. A squash that small is
// invisible and beats padding, which leaves asymmetric dead space in the icon.
const render = (size, flatten) => {
  let p = sharp(masked).resize(size, size, { fit: "fill" });
  if (flatten) p = p.flatten({ background: hex });
  return p.png({ compressionLevel: 9, palette: true }).toBuffer();
};
const emit = async (rel, size, flatten) => {
  const out = await render(size, flatten);
  writeFileSync(join(ROOT, rel), out);
  console.log(`  ${rel} ${size}px ${(out.length / 1024).toFixed(1)}kB`);
};

await emit("public/logo.png", 512);
await emit("app/icon.png", 512);
// Apple composites home-screen icons onto white and applies its own rounding,
// so this one ships square and flat on the brand teal rather than transparent.
await emit("app/apple-icon.png", 180, true);

// ICO (Vista and later) may hold PNG payloads verbatim: a 6-byte header, one
// 16-byte directory entry per size, then the PNG bytes back to back.
const icoSizes = [16, 32, 48];
const icoPngs = await Promise.all(icoSizes.map((n) => render(n)));
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(icoSizes.length, 4);
const dir = Buffer.alloc(16 * icoSizes.length);
let offset = 6 + 16 * icoSizes.length;
icoSizes.forEach((n, i) => {
  const o = i * 16;
  dir[o] = n;
  dir[o + 1] = n;
  dir.writeUInt16LE(1, o + 4);
  dir.writeUInt16LE(32, o + 6);
  dir.writeUInt32LE(icoPngs[i].length, o + 8);
  dir.writeUInt32LE(offset, o + 12);
  offset += icoPngs[i].length;
});
const ico = Buffer.concat([header, dir, ...icoPngs]);
writeFileSync(join(ROOT, "app/favicon.ico"), ico);
console.log(`  app/favicon.ico ${icoSizes.join("/")} ${(ico.length / 1024).toFixed(1)}kB`);

// satori (which renders the OG card) cannot fetch a URL or touch the
// filesystem at request time, so the mark is inlined there as a data URI.
const ogMark = await render(256);
writeFileSync(
  join(ROOT, "app/og-logo.ts"),
  `// GENERATED by scripts/generate-logo-assets.mjs — do not edit by hand.\n` +
    `// The OG card is rendered by satori, which cannot fetch a URL or read the\n` +
    `// filesystem at request time, so the mark is inlined here as a data URI.\n` +
    `export const BRAND_TEAL = "${hex}";\n\n` +
    `export const OG_LOGO_DATA_URI =\n  "data:image/png;base64,${ogMark.toString("base64")}";\n`
);
console.log(`  app/og-logo.ts (${(ogMark.length / 1024).toFixed(1)}kB png inlined)`);
