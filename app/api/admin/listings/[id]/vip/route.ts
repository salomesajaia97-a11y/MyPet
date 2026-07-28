import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { computeVipGrant, type VipListingFields } from "@/lib/marketplace/vipMath";
import { isVipTier, VIP_TIERS } from "@/lib/marketplace/vipPackages";
import { logAdminAction, requireAdmin } from "@/lib/admin/guard";

/**
 * Grant or revoke a VIP promotion by hand.
 *
 * The old panel control just flipped `isVip` with a null expiry, which left
 * `vipRank` at 0 — so an admin-granted "VIP" carried the badge but sorted below
 * every paid Standard listing, and `vipTier` never matched what the card drew.
 * This goes through computeVipGrant, the same function the payment webhook
 * uses, so a comped promotion places exactly like a bought one and extends an
 * existing period instead of truncating it.
 *
 * `days: null` means no expiry, which is what a permanent comp for a partner
 * needs. Revoking clears every VIP field together, so nothing is left half-set.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: { action?: unknown; tier?: unknown; days?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const revoke = body.action === "revoke";
  if (!revoke && !isVipTier(body.tier)) {
    return NextResponse.json(
      { error: `tier must be one of ${VIP_TIERS.join(", ")}` },
      { status: 400 }
    );
  }
  // null/absent → no expiry. A number has to be a sane positive day count.
  const days = body.days === null || body.days === undefined ? null : Number(body.days);
  if (!revoke && days !== null && (!Number.isFinite(days) || days <= 0 || days > 3650)) {
    return NextResponse.json({ error: "days must be between 1 and 3650" }, { status: 400 });
  }

  try {
    await connectDB();
    const listing = await ListingModel.findById(id).lean<
      (VipListingFields & { breed?: string }) | null
    >();
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (revoke) {
      const cleared = { isVip: false, vipUntil: null, vipTier: null, vipRank: 0 };
      await ListingModel.updateOne({ _id: id }, { $set: cleared });
      await logAdminAction(actor, "listing.vipRevoke", {
        type: "listing",
        id,
        summary: `Revoked VIP on ${listing.breed ?? "a listing"}`,
      });
      return NextResponse.json({ vip: cleared });
    }

    const tier = body.tier as (typeof VIP_TIERS)[number];
    const grant =
      days === null
        ? // computeVipGrant always produces a concrete expiry, so an unbounded
          // comp takes its tier and rank but keeps vipUntil null.
          { ...computeVipGrant(listing, tier, 1), vipUntil: null }
        : computeVipGrant(listing, tier, days);

    await ListingModel.updateOne({ _id: id }, { $set: grant });
    await logAdminAction(actor, "listing.vipGrant", {
      type: "listing",
      id,
      summary: `Granted ${tier} VIP${days === null ? " with no expiry" : ` for ${days} days`} on ${
        listing.breed ?? "a listing"
      }`,
    });
    return NextResponse.json({
      vip: {
        isVip: true,
        vipTier: grant.vipTier,
        vipRank: grant.vipRank,
        vipUntil: grant.vipUntil ? new Date(grant.vipUntil).toISOString() : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
