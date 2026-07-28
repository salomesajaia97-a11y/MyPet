import { describe, expect, it } from "vitest";
import { mergeFlags, mergeVip } from "./settings";
import { VIP_PACKAGES } from "./marketplace/vipPackages";

describe("mergeVip", () => {
  it("returns the code defaults when nothing is stored", () => {
    expect(mergeVip(null)).toEqual(VIP_PACKAGES);
    expect(mergeVip({})).toEqual(VIP_PACKAGES);
  });

  it("honours a stored price and duration", () => {
    const merged = mergeVip({ super: { amount: 999, days: 10 } });
    expect(merged.super.amount).toBe(999);
    expect(merged.super.days).toBe(10);
    // Rank is not editable — it is what placement sorts on.
    expect(merged.super.rank).toBe(VIP_PACKAGES.super.rank);
  });

  it("leaves tiers the document says nothing about at their defaults", () => {
    const merged = mergeVip({ super: { amount: 999, days: 10 } });
    expect(merged.ultra).toEqual(VIP_PACKAGES.ultra);
    expect(merged.standard).toEqual(VIP_PACKAGES.standard);
  });

  it("refuses nonsense rather than pricing a package at zero", () => {
    // The failure that matters: a half-written document must never make a
    // promotion free or instantly expired.
    const merged = mergeVip({
      standard: { amount: 0, days: 0 },
      super: { amount: -5, days: -1 },
      ultra: { amount: Number.NaN, days: Number.NaN },
    });
    expect(merged.standard).toEqual(VIP_PACKAGES.standard);
    expect(merged.super).toEqual(VIP_PACKAGES.super);
    expect(merged.ultra).toEqual(VIP_PACKAGES.ultra);
  });

  it("rounds a fractional amount to whole tetri", () => {
    expect(mergeVip({ standard: { amount: 350.7, days: 3.2 } }).standard.amount).toBe(351);
    expect(mergeVip({ standard: { amount: 350.7, days: 3.2 } }).standard.days).toBe(3);
  });
});

describe("mergeFlags", () => {
  it("defaults everything on, so an empty document behaves as before", () => {
    expect(mergeFlags(null)).toEqual({ aiSearch: true, payments: true, registration: true });
    expect(mergeFlags({})).toEqual({ aiSearch: true, payments: true, registration: true });
  });

  it("only an explicit false turns something off", () => {
    expect(mergeFlags({ payments: false }).payments).toBe(false);
    expect(mergeFlags({ payments: false }).aiSearch).toBe(true);
  });
});
