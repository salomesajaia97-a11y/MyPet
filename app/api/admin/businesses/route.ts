import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") return null;
  return session;
}

// Businesses for the admin moderation queue. Defaults to the pending queue;
// pass ?status=approved to review live ones.
export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  if (status !== "pending" && status !== "approved") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  await connectDB();
  const businesses = await BusinessModel.find({ status })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();
  return NextResponse.json({ businesses });
}
