import ListingModel from "@/lib/models/Listing";
import PaymentModel from "@/lib/models/Payment";
import { computeVipGrant } from "./vipMath";
import type { VipTier } from "./vipPackages";

/**
 * Turn an approved payment into a VIP promotion — exactly once.
 *
 * The conditional `findOneAndUpdate` on `appliedAt: null` is the idempotency
 * guard. Flitt retries callbacks on a 2s/60s/300s/600s/1h/24h schedule and the
 * status endpoint can reconcile the same order concurrently, so several callers
 * may race here. Only the one that flips `appliedAt` from null does the grant;
 * everyone else returns "skipped".
 */
export async function applyVipForOrder(
  orderId: string
): Promise<"granted" | "skipped" | "listing-missing"> {
  const claimed = await PaymentModel.findOneAndUpdate(
    { orderId, status: "approved", appliedAt: null },
    { $set: { appliedAt: new Date() } },
    { new: true }
  ).lean<{
    listingId: unknown;
    tier: VipTier;
    days: number;
  } | null>();

  if (!claimed) return "skipped";

  const listing = await ListingModel.findById(claimed.listingId).lean<{
    isVip?: boolean;
    vipUntil?: Date | null;
    vipTier?: VipTier | null;
    vipRank?: number;
  } | null>();

  if (!listing) {
    // Money was taken for a listing that no longer exists. `appliedAt` is
    // already set so we never retry; flag it for manual support instead.
    await PaymentModel.updateOne({ orderId }, { $set: { note: "listingMissing" } });
    console.warn(`[flitt] order ${orderId} approved but listing is gone`);
    return "listing-missing";
  }

  const grant = computeVipGrant(listing, claimed.tier, claimed.days);
  await ListingModel.updateOne({ _id: claimed.listingId }, { $set: grant });
  return "granted";
}
