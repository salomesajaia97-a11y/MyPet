import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";
import { handleMutationError } from "@/lib/api/errors";

const VALID_CATEGORIES = ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"];

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/services/[category]">
) {
  const { category } = await ctx.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = { category };

    if (searchParams.get("is24h") === "true") filter.is24h = true;
    if (searchParams.get("hasEmergency") === "true") filter.hasEmergency = true;
    if (searchParams.get("indoorAllowed") === "true") filter.indoorAllowed = true;

    filter.status = "approved";

    const businesses = await BusinessModel.find(filter)
      .sort({ aggregateRating: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ businesses });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/services/[category]">
) {
  const { category } = await ctx.params;

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
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
    // Never trust client-supplied moderation/ownership/rating fields.
    delete body._id;
    delete body.status;
    delete body.userId;
    delete body.source;
    delete body.placeId;
    delete body.aggregateRating;
    delete body.googleRating;
    delete body.googleRatingCount;
    delete body.nativeRatingCount;

    await connectDB();
    // User submissions enter the moderation queue as "pending" — they only go
    // public after an admin approves them.
    const business = await BusinessModel.create({
      ...body,
      category,
      userId: session.user.id,
      status: "pending",
    });
    return NextResponse.json({ business }, { status: 201 });
  } catch (err) {
    return handleMutationError(err, "services/[category] POST");
  }
}
