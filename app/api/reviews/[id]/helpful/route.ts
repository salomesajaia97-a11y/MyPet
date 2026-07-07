import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import { auth } from "@/auth";
import { rateLimit } from "@/lib/rateLimit";

// Toggle the caller's "helpful" vote on a review. Any authenticated user may
// vote, except the review's own author. Returns the new count + voted state.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = session.user.id;

  const limited = rateLimit(`helpful:${me}`, 60, 10 * 60_000);
  if (limited) return limited;

  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await connectDB();
  const review = await ReviewModel.findById(id);
  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (review.userId?.toString() === me) {
    return NextResponse.json({ error: "Cannot vote on your own review" }, { status: 403 });
  }

  const voters: { toString(): string }[] = review.helpfulUserIds ?? [];
  const already = voters.some((v) => v.toString() === me);
  if (already) {
    review.helpfulUserIds = voters.filter((v) => v.toString() !== me);
  } else {
    review.helpfulUserIds = [...voters, me];
  }
  await review.save();

  return NextResponse.json({
    count: review.helpfulUserIds.length,
    voted: !already,
  });
}
