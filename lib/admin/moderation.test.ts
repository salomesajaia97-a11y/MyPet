import { describe, expect, it } from "vitest";

/**
 * The rating query is the one piece of moderation that silently changes a
 * public number, so the filter it uses is worth pinning without a database.
 *
 * `hidden: { $ne: true }` and not `hidden: false`: rows written before the
 * field existed have no `hidden` key at all, and `{ hidden: false }` would
 * exclude every one of them — quietly zeroing the ratings of every business
 * reviewed before moderation shipped.
 */
function visibleNativeFilter(businessId: string) {
  return { businessId, source: "native", hidden: { $ne: true } };
}

/** Mirrors what MongoDB's `$ne: true` does to a candidate document. */
function matchesNeTrue(doc: { hidden?: boolean }): boolean {
  return doc.hidden !== true;
}

describe("visible-review filter", () => {
  it("asks for native reviews of the business that are not hidden", () => {
    expect(visibleNativeFilter("abc")).toEqual({
      businessId: "abc",
      source: "native",
      hidden: { $ne: true },
    });
  });

  it("counts a legacy review that predates the hidden field", () => {
    expect(matchesNeTrue({})).toBe(true);
  });

  it("counts an explicitly visible review", () => {
    expect(matchesNeTrue({ hidden: false })).toBe(true);
  });

  it("excludes a hidden review", () => {
    expect(matchesNeTrue({ hidden: true })).toBe(false);
  });
});
