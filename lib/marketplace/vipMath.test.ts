import { describe, expect, it } from "vitest";
import { activeRank, computeVipGrant, tierForRank } from "./vipMath";

const NOW = Date.UTC(2026, 6, 26, 12, 0, 0); // fixed clock, no Date.now() in assertions
const DAY = 86_400_000;

describe("activeRank", () => {
  it("is 0 for a listing that was never promoted", () => {
    expect(activeRank({}, NOW)).toBe(0);
  });

  it("is 0 once the promotion has lapsed", () => {
    expect(activeRank({ isVip: true, vipRank: 3, vipUntil: new Date(NOW - DAY) }, NOW)).toBe(0);
  });

  it("returns the stored rank while the promotion is live", () => {
    expect(activeRank({ isVip: true, vipRank: 2, vipUntil: new Date(NOW + DAY) }, NOW)).toBe(2);
  });

  it("treats an admin grant with no expiry as live", () => {
    expect(activeRank({ isVip: true, vipRank: 1, vipUntil: null }, NOW)).toBe(1);
  });
});

describe("tierForRank", () => {
  it("maps ranks back to tiers", () => {
    expect(tierForRank(0)).toBe(null);
    expect(tierForRank(1)).toBe("standard");
    expect(tierForRank(2)).toBe("super");
    expect(tierForRank(3)).toBe("ultra");
  });
});

describe("computeVipGrant", () => {
  it("starts from now for a listing that has never been promoted", () => {
    const g = computeVipGrant({}, "standard", 3, NOW);
    expect(g.vipUntil.getTime()).toBe(NOW + 3 * DAY);
    expect(g.vipTier).toBe("standard");
    expect(g.vipRank).toBe(1);
    expect(g.isVip).toBe(true);
  });

  it("extends from the existing expiry so paid days are never lost", () => {
    const listing = { isVip: true, vipRank: 1, vipUntil: new Date(NOW + 2 * DAY) };
    const g = computeVipGrant(listing, "super", 7, NOW);
    expect(g.vipUntil.getTime()).toBe(NOW + 9 * DAY);
    expect(g.vipRank).toBe(2);
    expect(g.vipTier).toBe("super");
  });

  it("never downgrades the tier", () => {
    const listing = { isVip: true, vipRank: 3, vipUntil: new Date(NOW + DAY) };
    const g = computeVipGrant(listing, "standard", 3, NOW);
    expect(g.vipRank).toBe(3);
    expect(g.vipTier).toBe("ultra");
    expect(g.vipUntil.getTime()).toBe(NOW + 4 * DAY);
  });

  it("does not let a lapsed higher tier upgrade a new purchase", () => {
    const listing = { isVip: true, vipRank: 3, vipUntil: new Date(NOW - DAY) };
    const g = computeVipGrant(listing, "standard", 3, NOW);
    expect(g.vipRank).toBe(1);
    expect(g.vipUntil.getTime()).toBe(NOW + 3 * DAY);
  });

  it("gives an unbounded admin grant a concrete expiry", () => {
    const listing = { isVip: true, vipRank: 0, vipUntil: null };
    const g = computeVipGrant(listing, "ultra", 14, NOW);
    expect(g.vipUntil.getTime()).toBe(NOW + 14 * DAY);
    expect(g.vipRank).toBe(3);
  });
});
