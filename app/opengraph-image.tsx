import { ImageResponse } from "next/og";
import { OG_LOGO_DATA_URI } from "./og-logo";

/**
 * Site-wide social card. Root-segment file convention, so every page that
 * doesn't set its own `openGraph.images` (listing and business detail pages
 * do) shares this one.
 *
 * Deliberately Latin-only text: the generator falls back to a bundled font
 * that has no Mkhedruli glyphs, and Georgian would render as empty boxes.
 */
export const alt = "MyPet.ge — pet listings and services in Georgia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0E4A5C 0%, #0F2830 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {/* The real mark, inlined as a data URI — satori cannot fetch a URL
              or read the filesystem while rendering.
              It sits on a light chip rather than straight on the background:
              the mark's own teal (#175375) is within a few points of the
              card's gradient (#0E4A5C), so unbacked it would dissolve into it
              and leave a floating white paw. */}
          <div
            style={{
              display: "flex",
              padding: "12px",
              borderRadius: "30px",
              background: "#FFFFFF",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={OG_LOGO_DATA_URI} width={92} height={92} alt="" />
          </div>
          <div style={{ display: "flex", fontSize: "56px", fontWeight: 700 }}>
            MyPet.ge
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={{ display: "flex", fontSize: "62px", fontWeight: 700, lineHeight: 1.15 }}>
            Pets, adoption & services in Georgia
          </div>
          <div style={{ display: "flex", fontSize: "32px", color: "#A9D3DF" }}>
            Buy · Sell · Adopt · Mating · Lost & Found · Vet clinics
          </div>
        </div>

        <div style={{ display: "flex", fontSize: "30px", color: "#EBF6FA" }}>
          mypetge.online
        </div>
      </div>
    ),
    size
  );
}
