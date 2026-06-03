import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";

const VALID_TYPES = ["buy-sell", "adoption", "mating", "lost-found"];

export async function GET(
  req: NextRequest,
  ctx: RouteContext<"/api/marketplace/[type]">
) {
  const { type } = await ctx.params;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = { type };

    if (searchParams.get("species")) filter.species = searchParams.get("species");
    if (searchParams.get("pedigree")) filter.pedigree = searchParams.get("pedigree");
    if (searchParams.get("status")) filter.status = searchParams.get("status");

    const listings = await ListingModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ listings });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext<"/api/marketplace/[type]">
) {
  const { type } = await ctx.params;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid listing type" }, { status: 400 });
  }

  try {
    const body = await req.json();
    await connectDB();
    const listing = await ListingModel.create({ ...body, type });
    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
