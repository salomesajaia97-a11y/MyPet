import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";
import { handleMutationError } from "@/lib/api/errors";

const VALID_CATEGORIES = ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"];

// GET /api/services/[category]/[id]
// Fetches a single service. Nested under [category] because a sibling
// [id] segment would collide with the existing [category] route.
export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/services/[category]/[id]">
) {
  const { category, id } = await ctx.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await connectDB();
    const service = await BusinessModel.findOne({ _id: id, category }).lean();
    if (!service) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ service });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/services/[category]/[id]
// Owner (or admin) edits their business. Approval status is intentionally
// preserved — editing an approved business keeps it approved. Ownership,
// moderation status, category, and rating/source fields can never be
// reassigned from client input.
export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/services/[category]/[id]">
) {
  const { category, id } = await ctx.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(id)) {
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
    // Never let a client reassign ownership, moderation status, identity,
    // or curated/rating fields.
    delete body._id;
    delete body.status;
    delete body.userId;
    delete body.category;
    delete body.source;
    delete body.placeId;
    delete body.aggregateRating;
    delete body.googleRating;
    delete body.googleRatingCount;
    delete body.nativeRatingCount;
    delete body.createdAt;
    delete body.updatedAt;

    await connectDB();
    const business = await BusinessModel.findOne({ _id: id, category });
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = business.userId?.toString() === session.user.id;
    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    business.set(body);
    await business.save();
    return NextResponse.json({ service: business.toObject() });
  } catch (err) {
    return handleMutationError(err, "services/[category]/[id] PATCH");
  }
}

// DELETE /api/services/[category]/[id] — owner or admin removes a business.
export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/services/[category]/[id]">
) {
  const { category, id } = await ctx.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const business = await BusinessModel.findOne({ _id: id, category });
    if (!business) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isOwner = business.userId?.toString() === session.user.id;
    if (!isOwner && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await business.deleteOne();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
