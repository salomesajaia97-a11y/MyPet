import { VIP_PACKAGES, type VipTier } from "./vipPackages";

export type VipListingFields = {
  isVip?: boolean;
  vipUntil?: string | Date | null;
  vipTier?: VipTier | null;
  vipRank?: number;
};

const DAY_MS = 86_400_000;

/**
 * Placement rank a listing is entitled to *right now*. An expired promotion
 * scores 0, which is what stops a lapsed Ultra from silently upgrading a newly
 * bought Standard.
 */
export function activeRank(l: VipListingFields, now: number = Date.now()): number {
  if (!l.isVip) return 0;
  if (l.vipUntil && new Date(l.vipUntil).getTime() <= now) return 0;
  return l.vipRank ?? 0;
}

export function tierForRank(rank: number): VipTier | null {
  if (rank >= 3) return "ultra";
  if (rank === 2) return "super";
  if (rank === 1) return "standard";
  return null;
}

/**
 * Fields to write on the listing when a payment is approved.
 *
 * Extends from the later of "now" and the current expiry, so buying Super with
 * two days left yields now + 2d + 7d. The tier only ever moves up. `days` is
 * passed in from the payment record rather than read from VIP_PACKAGES, so
 * repricing a package cannot alter an order already in flight.
 */
export function computeVipGrant(
  listing: VipListingFields,
  tier: VipTier,
  days: number,
  now: number = Date.now()
): { isVip: true; vipUntil: Date; vipTier: VipTier; vipRank: number } {
  const current = listing.vipUntil ? new Date(listing.vipUntil).getTime() : 0;
  const base = current > now ? current : now;
  const rank = Math.max(activeRank(listing, now), VIP_PACKAGES[tier].rank);
  return {
    isVip: true,
    vipUntil: new Date(base + days * DAY_MS),
    vipTier: tierForRank(rank) ?? tier,
    vipRank: rank,
  };
}
