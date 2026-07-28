import { describe, expect, it } from "vitest";
import { formatAge, formatPrice } from "./format";

describe("formatPrice", () => {
  it("prints GEL by default and dollars for USD", () => {
    expect(formatPrice(1200)).toBe("1,200₾");
    expect(formatPrice(1200, "USD")).toBe("$1,200");
    expect(formatPrice(1200, "GEL")).toBe("1,200₾");
  });

  it("spaces the lari sign only when asked", () => {
    expect(formatPrice(50, null, { spaced: true })).toBe("50 ₾");
    expect(formatPrice(50, "USD", { spaced: true })).toBe("$50");
  });

  it("returns null for a price that is absent rather than zero", () => {
    // The whole point of the helper: these used to reach .toLocaleString() and
    // throw while rendering a public feed.
    expect(formatPrice(undefined)).toBeNull();
    expect(formatPrice(null)).toBeNull();
    expect(formatPrice(Number.NaN)).toBeNull();
    expect(formatPrice("1200")).toBeNull();
  });

  it("treats a free listing as a real price of zero", () => {
    expect(formatPrice(0)).toBe("0₾");
  });
});

describe("formatAge", () => {
  const units = { month: "mo", year: "yr" };

  it("reads in months under a year and in years above it", () => {
    expect(formatAge(5, units)).toBe("5 mo");
    expect(formatAge(24, units)).toBe("2 yr");
    expect(formatAge(26, units)).toBe("2 yr 2 mo");
  });

  it("returns an empty label for nonsense input", () => {
    expect(formatAge(-1, units)).toBe("");
    expect(formatAge(Number.NaN, units)).toBe("");
  });
});
