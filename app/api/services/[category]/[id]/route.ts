import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";

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
