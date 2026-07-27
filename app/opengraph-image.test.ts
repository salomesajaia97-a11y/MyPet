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
