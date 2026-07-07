import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import BusinessModel from "@/lib/models/Business";
import { recomputeBusinessRating } from "@/lib/recomputeRating";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";
import { handleMutationError } from "@/lib/api/errors";

const MAX_TEXT = 2000;
const MAX_PHOTOS = 3;

// Validate a client-supplied photos value into a clean string[] (≤ MAX_PHOTOS).
// Returns null when the shape is invalid.
function parsePhotos(input: unknown): string[] | null {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return null;
  if (input.length > MAX_PHOTOS) return null;
  if (!input.every((p) => typeof p === "string" && p.length > 0)) return null;
  return input;
}

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
    let body: { businessId?: string; rating?: unknown; text?: unknown; photos?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const { businessId } = body;
    const rating = Number(body.rating);

    if (!businessId || !isValidObjectId(businessId)) {
      return NextResponse.json({ error: "Valid businessId required" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be an integer 1–5" }, { status: 400 });
    }
    // Text is optional — a star-only review is valid. Reject only wrong types.
    if (body.text !== undefined && body.text !== null && typeof body.text !== "string") {
      return NextResponse.json({ error: "Invalid review text" }, { status: 400 });
    }
    const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";

    const photos = parsePhotos(body.photos);
    if (photos === null) {
      return NextResponse.json({ error: `Up to ${MAX_PHOTOS} valid image URLs allowed` }, { status: 400 });
    }

    await connectDB();

    // The business must exist before we attach a review / recompute its rating.
    const business = await BusinessModel.findById(businessId).select("_id");
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // One native review per user per business — prevents a single user from
    // inflating (or tanking) a business's aggregate rating with repeats.
    const already = await ReviewModel.findOne({
      businessId,
      userId: session.user.id,
      source: "native",
    }).select("_id");
    if (already) {
      return NextResponse.json(
        { error: "თქვენ უკვე დატოვეთ შეფასება ამ ბიზნესზე" },
        { status: 409 }
      );
    }

    // Identity comes from the session, never the client — reviews can't be spoofed.
    const review = await ReviewModel.create({
      businessId,
      source: "native",
      userId: session.user.id,
      reviewerName: session.user.name ?? session.user.email ?? "მომხმარებელი",
      reviewerAvatar: session.user.image ?? undefined,
      rating,
      text,
      photos,
    });

    await recomputeBusinessRating(businessId);

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    return handleMutationError(err, "reviews POST");
  }
}
