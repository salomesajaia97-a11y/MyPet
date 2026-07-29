import { describe, expect, it } from "vitest";
import { INDEXNOW_KEY_PATH, indexNowPayload } from "./indexNow";
import { SITE_URL } from "@/lib/siteUrl";

describe("indexNowPayload", () => {
  it("submits nothing without a key", () => {
    expect(indexNowPayload(["/buy-sell"], null)).toBeNull();
  });

  it("submits nothing when there are no usable paths", () => {
    // An empty urlList is a 400 from the endpoint, not a no-op.
    expect(indexNowPayload([], "k")).toBeNull();
    expect(indexNowPayload(["", "   "], "k")).toBeNull();
  });

  it("makes paths absolute on the canonical host and names the key file", () => {
    const payload = indexNowPayload(["/listings/abc"], "k");
    expect(payload).toEqual({
      host: new URL(SITE_URL).host,
      key: "k",
      keyLocation: `${SITE_URL}${INDEXNOW_KEY_PATH}`,
      urlList: [`${SITE_URL}/listings/abc`],
    });
  });

  it("leaves an already absolute URL alone", () => {
    const payload = indexNowPayload([`${SITE_URL}/adoption`], "k");
    expect(payload?.urlList).toEqual([`${SITE_URL}/adoption`]);
  });

  it("collapses duplicates — a caller may name the same feed twice", () => {
    const payload = indexNowPayload(["/buy-sell", "/buy-sell", "/adoption"], "k");
    expect(payload?.urlList).toEqual([`${SITE_URL}/buy-sell`, `${SITE_URL}/adoption`]);
  });

  it("caps a submission at the protocol's 10,000 URLs", () => {
    const paths = Array.from({ length: 10_050 }, (_, i) => `/listings/${i}`);
    expect(indexNowPayload(paths, "k")?.urlList).toHaveLength(10_000);
  });
});
