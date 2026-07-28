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
export type VipState = {
  isVip: boolean;
  vipUntil: Date | null;
  vipTier: VipTier | null;
  vipRank: number;
};

/**
 * Fields to write on the listing when an approved payment is later reversed —
 * a refund or a chargeback. Without this a reversed order keeps its paid
 * placement forever: the money goes back and the promotion stays.
 *
 * Two paths, because a listing can be promoted more than once:
 *
 * - Nothing has been granted since (the listing still carries the expiry this
 *   order wrote), so the pre-grant snapshot is restored exactly — including the
 *   tier, which a subtraction alone could not undo.
 * - A later payment has moved the expiry on, so only this order's days are
 *   taken back and the newer purchase keeps its tier.
 *
 * Either way, a listing left with no time on it drops out of VIP entirely
 * rather than lingering at rank 0 with `isVip` still true.
 */
export function computeVipRevert(
  input: {
    listing: VipListingFields;
    /** `vipUntil` this grant wrote, to detect a newer grant on top of it. */
    grantedUntil?: string | Date | null;
    /** Listing VIP state captured immediately before this grant applied. */
    previous?: VipListingFields | null;
    /** Days this order paid for. */
    days: number;
  },
  now: number = Date.now()
): VipState {
  const { listing, grantedUntil, previous, days } = input;
  const currentMs = listing.vipUntil ? new Date(listing.vipUntil).getTime() : null;
  const grantedMs = grantedUntil ? new Date(grantedUntil).getTime() : null;
  const untouched = grantedMs !== null && currentMs === grantedMs;

  let state: VipState;
  if (untouched && previous) {
    state = {
      isVip: !!previous.isVip,
      vipUntil: previous.vipUntil ? new Date(previous.vipUntil) : null,
      vipTier: previous.vipTier ?? null,
      vipRank: previous.vipRank ?? 0,
    };
  } else {
    const base = currentMs ?? now;
    state = {
      isVip: !!listing.isVip,
      vipUntil: new Date(base - days * DAY_MS),
      vipTier: listing.vipTier ?? null,
      vipRank: listing.vipRank ?? 0,
    };
  }

  // An unbounded (admin) grant has no expiry to compare, so it survives.
  const lapsed = state.vipUntil !== null && state.vipUntil.getTime() <= now;
  if (!state.isVip || lapsed) {
    return { isVip: false, vipUntil: state.vipUntil, vipTier: null, vipRank: 0 };
  }
  return state;
}

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
