import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";

const VALID_CATEGORIES = ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"];

// GET /api/services?category=vet-clinics
// Lists approved services, optionally filtered by category.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const filter: Record<string, unknown> = { status: "approved" };
    if (category) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      filter.category = category;
    }

    await connectDB();
    const services = await BusinessModel.find(filter)
      .sort({ aggregateRating: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ services });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
