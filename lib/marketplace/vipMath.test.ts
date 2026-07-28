import { describe, expect, it } from "vitest";
import { activeRank, computeVipGrant, computeVipRevert, tierForRank } from "./vipMath";

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

describe("computeVipRevert", () => {
  it("clears VIP entirely when the reversed order was the only promotion", () => {
    const granted = new Date(NOW + 7 * DAY);
    const r = computeVipRevert(
      {
        listing: { isVip: true, vipRank: 2, vipTier: "super", vipUntil: granted },
        grantedUntil: granted,
        previous: { isVip: false, vipUntil: null, vipTier: null, vipRank: 0 },
        days: 7,
      },
      NOW
    );
    expect(r).toEqual({ isVip: false, vipUntil: null, vipTier: null, vipRank: 0 });
  });

  it("restores the earlier tier when the reversed order was an upgrade", () => {
    // Standard with 2 days left, then Ultra bought on top → 2 + 14 days at rank 3.
    const granted = new Date(NOW + 16 * DAY);
    const r = computeVipRevert(
      {
        listing: { isVip: true, vipRank: 3, vipTier: "ultra", vipUntil: granted },
        grantedUntil: granted,
        previous: {
          isVip: true,
          vipUntil: new Date(NOW + 2 * DAY),
          vipTier: "standard",
          vipRank: 1,
        },
        days: 14,
      },
      NOW
    );
    expect(r.isVip).toBe(true);
    expect(r.vipRank).toBe(1);
    expect(r.vipTier).toBe("standard");
    expect(r.vipUntil?.getTime()).toBe(NOW + 2 * DAY);
  });

  it("only subtracts the paid days when a later purchase moved the expiry on", () => {
    // Reversed order granted 7 days; a newer Ultra has since extended it.
    const r = computeVipRevert(
      {
        listing: { isVip: true, vipRank: 3, vipTier: "ultra", vipUntil: new Date(NOW + 30 * DAY) },
        grantedUntil: new Date(NOW + 7 * DAY),
        previous: { isVip: false, vipUntil: null, vipTier: null, vipRank: 0 },
        days: 7,
      },
      NOW
    );
    expect(r.isVip).toBe(true);
    expect(r.vipRank).toBe(3);
    expect(r.vipUntil?.getTime()).toBe(NOW + 23 * DAY);
  });

  it("drops VIP when subtracting the paid days leaves nothing", () => {
    const r = computeVipRevert(
      {
        listing: { isVip: true, vipRank: 1, vipTier: "standard", vipUntil: new Date(NOW + DAY) },
        grantedUntil: new Date(NOW + 5 * DAY),
        previous: null,
        days: 3,
      },
      NOW
    );
    expect(r.isVip).toBe(false);
    expect(r.vipRank).toBe(0);
    expect(r.vipTier).toBe(null);
  });

  it("leaves an unbounded admin grant alone", () => {
    const r = computeVipRevert(
      {
        listing: { isVip: true, vipRank: 2, vipTier: "super", vipUntil: new Date(NOW + 9 * DAY) },
        grantedUntil: new Date(NOW + 9 * DAY),
        previous: { isVip: true, vipUntil: null, vipTier: "super", vipRank: 2 },
        days: 7,
      },
      NOW
    );
    expect(r.isVip).toBe(true);
    expect(r.vipUntil).toBe(null);
    expect(r.vipRank).toBe(2);
  });

  it("is a no-op shape when the listing was never VIP", () => {
    const r = computeVipRevert(
      { listing: {}, grantedUntil: null, previous: null, days: 7 },
      NOW
    );
    expect(r.isVip).toBe(false);
    expect(r.vipRank).toBe(0);
  });
});
