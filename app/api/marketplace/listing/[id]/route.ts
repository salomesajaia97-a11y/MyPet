import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";
import { auth } from "@/auth";
import { handleMutationError } from "@/lib/api/errors";

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
    // VIP promotion (`isVip`/`vipUntil`) is admin-only here — an owner editing
    // their own listing must not be able to grant themselves VIP. Admins keep
    // it (this is the route the admin manager uses to toggle VIP). A real paid
    // promotion flow would set these from a verified payment webhook, not here.
    if (session.user.role !== "admin") {
      delete body.isVip;
      delete body.vipUntil;
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

    await listing.deleteOne();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
