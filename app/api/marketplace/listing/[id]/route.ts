import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ListingModel from "@/lib/models/Listing";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await connectDB();
    const listing = await ListingModel.findById(id).lean();
    if (!listing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ listing });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
