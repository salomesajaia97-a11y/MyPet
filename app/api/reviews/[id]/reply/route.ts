import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

const MAX_REPLY = 2000;

// Load a review and confirm the caller owns its business. Owner = the user who
// submitted the business (business.userId). Scraped businesses have no owner,
// so no one can reply.
async function loadOwnedReview(reviewId: string, me: string) {
  const review = await ReviewModel.findById(reviewId);
  if (!review) return { error: "notfound" as const };
  const business = await BusinessModel.findById(review.businessId).select("userId");
  if (!business?.userId || business.userId.toString() !== me) {
    return { error: "forbidden" as const };
  }
  return { review };
}

// Create or update the business owner's reply to a review.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const limited = rateLimit(`reply:${me}`, 30, 10 * 60_000);
  if (limited) return limited;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let raw: unknown;
  try {
    ({ text: raw } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = typeof raw === "string" ? raw.trim().slice(0, MAX_REPLY) : "";
  if (text.length < 1) {
    return NextResponse.json({ error: "Reply cannot be empty" }, { status: 400 });
  }

  await connectDB();
  const { review, error } = await loadOwnedReview(id, me);
  if (error === "notfound") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (error === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const r = review!;
  r.ownerReply = {
    text,
    createdAt: r.ownerReply?.createdAt ?? now,
    updatedAt: now,
  };
  await r.save();

  return NextResponse.json({ ownerReply: r.ownerReply });
}

// Remove the owner's reply.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await connectDB();
  const { review, error } = await loadOwnedReview(id, me);
  if (error === "notfound") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (error === "forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const r = review!;
  r.ownerReply = undefined;
  await r.save();

  return NextResponse.json({ success: true });
}
