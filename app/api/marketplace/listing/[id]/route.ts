import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { auth } from "@/auth";
import { handleMutationError } from "@/lib/api/errors";
import { logAdminAction } from "@/lib/admin/guard";
import { deleteListingCascade } from "@/lib/services/deleteListing";
import { submitToIndexNow } from "@/lib/seo/indexNow";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const listing = await ListingModel.findById(id).lean();
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ listing });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    // `type`, ownership, and timestamps must not be reassigned from client input.
    delete body._id;
    delete body.type;
    delete body.userId;
    delete body.createdAt;
    delete body.updatedAt;
    // The view counter is written only by the view route, which dedupes per
    // visitor per day. Letting it through here would let any owner type in
    // their own popularity.
    delete body.views;
    // VIP promotion is admin-only here — an owner editing their own listing
    // must not be able to grant or upgrade their own promotion. Admins keep it
    // (this is the route the admin manager uses to toggle VIP). A real paid
    // promotion flow sets these from a verified payment webhook, not here.
    //
    // `vipRank`/`vipTier` matter as much as `isVip`: placement sorts on
    // `vipRank` and only checks that `isVip` is true, so an owner who bought
    // Standard could otherwise PATCH themselves to rank 3 and outrank every
    // paying Ultra for free.
    if (session.user.role !== "admin") {
      delete body.isVip;
      delete body.vipUntil;
      delete body.vipTier;
      delete body.vipRank;
    }

    await connectDB();
    const listing = await ListingModel.findById(id);
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = listing.userId?.toString() === session.user.id;
    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    listing.set(body);
    await listing.save();
    // An admin editing someone else's listing is a moderation action, so it
    // belongs in the audit trail; an owner editing their own does not.
    if (!isOwner && session.user.role === "admin") {
      await logAdminAction(
        { id: session.user.id, email: session.user.email ?? null },
        "listing.update",
        { type: "listing", id, summary: `Edited ${listing.breed ?? "a listing"}` }
      );
    }
    // The public page changed — have it re-read rather than serving a stale
    // snippet (a sold pet, an old price) in results for weeks.
    submitToIndexNow([`/listings/${id}`]);
    return NextResponse.json({ listing: listing.toObject() });
  } catch (err) {
    return handleMutationError(err, "marketplace/listing/[id] PATCH");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const listing = await ListingModel.findById(id);
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = listing.userId?.toString() === session.user.id;
    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const label = listing.breed ?? "a listing";
    const type = listing.type;
    await deleteListingCascade(id);
    // Submitting a deleted URL is the documented way to get it dropped: the
    // engine refetches, gets a 404, and removes it instead of showing a dead
    // result for months.
    submitToIndexNow([`/listings/${id}`, ...(type ? [`/${type}`] : [])]);
    if (!isOwner && session.user.role === "admin") {
      await logAdminAction(
        { id: session.user.id, email: session.user.email ?? null },
        "listing.delete",
        { type: "listing", id, summary: `Deleted ${label}` }
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
