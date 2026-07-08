import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import { auth } from "@/auth";

/** Businesses (services) created by the currently logged-in user, newest first. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const businesses = await BusinessModel.find({ userId: session.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ businesses });
}
