import { describe, expect, it } from "vitest";
import { VIP_PACKAGES, VIP_TIERS, formatGel, isVipTier } from "./vipPackages";

describe("VIP packages", () => {
  it("prices the three packages in tetri", () => {
    expect(VIP_PACKAGES.standard).toMatchObject({ days: 3, amount: 300, rank: 1 });
    expect(VIP_PACKAGES.super).toMatchObject({ days: 7, amount: 700, rank: 2 });
    expect(VIP_PACKAGES.ultra).toMatchObject({ days: 14, amount: 1200, rank: 3 });
  });

  it("lists tiers cheapest first", () => {
    expect(VIP_TIERS).toEqual(["standard", "super", "ultra"]);
  });

  it("keeps every amount a whole number of tetri", () => {
    for (const tier of VIP_TIERS) {
      expect(Number.isInteger(VIP_PACKAGES[tier].amount)).toBe(true);
    }
  });

  it("guards unknown tiers", () => {
    expect(isVipTier("ultra")).toBe(true);
    expect(isVipTier("platinum")).toBe(false);
    expect(isVipTier(undefined)).toBe(false);
    expect(isVipTier(3)).toBe(false);
  });
});

describe("formatGel", () => {
  it("renders whole lari without decimals", () => {
    expect(formatGel(300)).toBe("3");
    expect(formatGel(1200)).toBe("12");
  });

  it("keeps tetri when they are non-zero", () => {
    expect(formatGel(350)).toBe("3.50");
  });
});
