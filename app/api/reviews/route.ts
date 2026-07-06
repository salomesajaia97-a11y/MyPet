import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId || !isValidObjectId(businessId)) {
    return NextResponse.json({ error: "Valid businessId required" }, { status: 400 });
  }

  try {
    await connectDB();
    const reviews = await ReviewModel.find({ businessId })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`reviews:${session.user.id}`, 5, 10 * 60_000);
  if (limited) return limited;

  try {
    let body: { businessId?: string; rating?: unknown; text?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { businessId, text } = body;
    const rating = Number(body.rating);

    if (!businessId || !isValidObjectId(businessId)) {
      return NextResponse.json({ error: "Valid businessId required" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer 1–5" }, { status: 400 });
    }
    if (typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json({ error: "Review text must be at least 10 characters" }, { status: 400 });
    }

    await connectDB();

    // The business must exist before we attach a review / recompute its rating.
    const business = await BusinessModel.findById(businessId);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const googleCount = business.googleRatingCount ?? 0;

    // Establish the Google baseline. Docs seeded before the `googleRating`
    // field lack it; on their FIRST native review the current aggregateRating
    // still equals the pristine Google average, so backfill it then.
    let googleRating = business.googleRating ?? 0;
    if (!googleRating && googleCount > 0) {
      const priorNativeCount = await ReviewModel.countDocuments({
        businessId,
        source: "native",
      });
      if (priorNativeCount === 0) {
        googleRating = business.aggregateRating ?? 0;
        business.googleRating = googleRating;
      }
    }

    // Identity comes from the session, never the client — reviews can't be spoofed.
    const review = await ReviewModel.create({
      businessId,
      source: "native",
      reviewerName: session.user.name ?? session.user.email ?? "მომხმარებელი",
      reviewerAvatar: session.user.image ?? undefined,
      rating,
      text: text.trim(),
    });

    // Blend the immutable Google baseline with all native reviews so a native
    // review never overwrites the seeded Google score.
    const natives = await ReviewModel.find({ businessId, source: "native" }).lean();
    const nativeCount = natives.length;
    const nativeSum = natives.reduce((sum, r) => sum + r.rating, 0);
    const totalCount = googleCount + nativeCount;
    const avg = totalCount > 0 ? (googleRating * googleCount + nativeSum) / totalCount : 0;

    business.aggregateRating = Math.round(avg * 10) / 10;
    business.nativeRatingCount = nativeCount;
    await business.save();

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
