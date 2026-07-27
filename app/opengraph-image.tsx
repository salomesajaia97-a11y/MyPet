import { ImageResponse } from "next/og";

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
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "84px",
              height: "84px",
              borderRadius: "999px",
              background: "#EBF6FA",
              color: "#0E4A5C",
              fontSize: "38px",
              fontWeight: 700,
            }}
          >
            {/* Plain glyphs, not an emoji: the bundled font has no emoji
                table and would render tofu. */}
            MP
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
