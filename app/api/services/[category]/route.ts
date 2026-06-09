import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";

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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await connectDB();
    const userId = (session.user as typeof session.user & { id?: string }).id;
    const business = await BusinessModel.create({ ...body, category, userId, status: "approved" });
    return NextResponse.json({ business }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
