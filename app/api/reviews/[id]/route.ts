import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import { recomputeBusinessRating } from "@/lib/recomputeRating";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

const MAX_TEXT = 2000;
const MAX_PHOTOS = 3;

// Only our own Cloudinary uploads — reject arbitrary/`javascript:` URLs that
// would otherwise be stored and rendered into an <a href> (stored XSS).
function isOwnUpload(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

function parsePhotos(input: unknown): string[] | null {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return null;
  if (input.length > MAX_PHOTOS) return null;
  if (!input.every((p) => typeof p === "string" && p.length > 0 && isOwnUpload(p))) return null;
  return input;
}

// Edit own review. Author-only; native reviews only.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(`reviews:${session.user.id}`, 20, 10 * 60_000);
  if (limited) return limited;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { rating?: unknown; text?: unknown; photos?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be an integer 1–5" }, { status: 400 });
  }
  if (body.text !== undefined && body.text !== null && typeof body.text !== "string") {
    return NextResponse.json({ error: "Invalid review text" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text.trim().slice(0, MAX_TEXT) : "";
  const photos = parsePhotos(body.photos);
  if (photos === null) {
    return NextResponse.json({ error: `Up to ${MAX_PHOTOS} valid image URLs allowed` }, { status: 400 });
  }

  await connectDB();
  const review = await ReviewModel.findById(id);
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Only the native author may edit; legacy rows without userId are locked.
  if (review.source !== "native" || review.userId?.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  review.rating = rating;
  review.text = text;
  review.photos = photos;
  review.editedAt = new Date();
  await review.save();

  await recomputeBusinessRating(review.businessId);

  return NextResponse.json({ review });
}

// Delete own review. Author-only.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await connectDB();
  const review = await ReviewModel.findById(id);
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (review.source !== "native" || review.userId?.toString() !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const businessId = review.businessId;
  await review.deleteOne();
  await recomputeBusinessRating(businessId);

  return NextResponse.json({ success: true });
}
