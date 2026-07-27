import { describe, expect, it } from "vitest";

/**
 * `next build` cannot run on the dev machine (OOM), so the social cards are
 * gated here instead: render the root card through satori/resvg and assert it
 * produces a real 1200x630 PNG. Catches font/layout crashes that would
 * otherwise only surface as a broken image in production.
 */
describe("opengraph-image", () => {
  it("renders a 1200x630 PNG", async () => {
    const mod = await import("./opengraph-image");
    expect(mod.size).toEqual({ width: 1200, height: 630 });
    expect(mod.contentType).toBe("image/png");

    const buf = Buffer.from(await (await mod.default()).arrayBuffer());

    expect(buf.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    // IHDR stores width/height as big-endian uint32 at offsets 16 and 20.
    expect(buf.readUInt32BE(16)).toBe(1200);
    expect(buf.readUInt32BE(20)).toBe(630);
  }, 60_000);

  it("twitter card re-exports the same renderer", async () => {
    const og = await import("./opengraph-image");
    const tw = await import("./twitter-image");
    expect(tw.default).toBe(og.default);
    expect(tw.size).toEqual(og.size);
  });
});

/**
 * The brand mark is generated from the source artwork, so these assert the
 * generated files are actually present and shaped right — a regenerate that
 * silently produced a stretched or opaque icon would otherwise only show up as
 * a wrong-looking favicon in production.
 */
describe("brand mark", () => {
  const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  it("inlines the logo in the OG card as a real PNG data URI", async () => {
    const { OG_LOGO_DATA_URI } = await import("./og-logo");
    expect(OG_LOGO_DATA_URI.startsWith("data:image/png;base64,")).toBe(true);

    const bytes = Buffer.from(OG_LOGO_DATA_URI.split(",")[1], "base64");
    expect(bytes.subarray(0, 8)).toEqual(PNG_MAGIC);
    expect(bytes.readUInt32BE(16)).toBe(256);
    expect(bytes.readUInt32BE(20)).toBe(256);
  });

  it.each([
    ["public/logo.png", 512, true],
    ["app/icon.png", 512, true],
    ["app/apple-icon.png", 180, false],
  ])("%s is a square %ipx PNG", async (file, size, transparent) => {
    const { readFileSync } = await import("node:fs");
    const buf = readFileSync(file);
    expect(buf.subarray(0, 8)).toEqual(PNG_MAGIC);
    expect(buf.readUInt32BE(16)).toBe(size);
    expect(buf.readUInt32BE(20)).toBe(size);
    // IHDR colour type at offset 25: 6 = RGBA, 3 = palette (with a tRNS chunk
    // carrying the alpha). Apple's icon is deliberately flat, the others are
    // knocked out at the corners.
    const hasAlpha = buf[25] === 6 || buf[25] === 4 || buf.includes(Buffer.from("tRNS"));
    expect(hasAlpha).toBe(transparent);
  });

  it("ships a favicon.ico holding 16/32/48 images", async () => {
    const { readFileSync } = await import("node:fs");
    const ico = readFileSync("app/favicon.ico");
    expect(ico.readUInt16LE(0)).toBe(0); // reserved
    expect(ico.readUInt16LE(2)).toBe(1); // type: icon
    const count = ico.readUInt16LE(4);
    expect(count).toBe(3);
    expect([0, 1, 2].map((i) => ico[6 + i * 16])).toEqual([16, 32, 48]);
  });
});
