import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import BusinessModel from "@/lib/models/Business";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const businessId = searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "businessId required" }, { status: 400 });
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
  try {
    const { businessId, reviewerName, rating, text } = await req.json();

    if (!businessId || !reviewerName || !rating || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
    }

    await connectDB();

    const review = await ReviewModel.create({
      businessId,
      source: "native",
      reviewerName,
      rating,
      text,
    });

    // Recalculate aggregate rating
    const allReviews = await ReviewModel.find({ businessId }).lean();
    const total = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = total / allReviews.length;
    const nativeCount = allReviews.filter((r) => r.source === "native").length;

    await BusinessModel.findByIdAndUpdate(businessId, {
      aggregateRating: Math.round(avg * 10) / 10,
      nativeRatingCount: nativeCount,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
