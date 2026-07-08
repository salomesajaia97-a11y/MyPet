import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import NotificationModel from "@/lib/models/Notification";

async function requireAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (!session || role !== "admin") return null;
  return session;
}

// Approve a pending business (set status → approved).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let action: unknown = "approve";
  try {
    ({ action } = await req.json());
  } catch {
    /* default to approve if no body */
  }
  if (action !== "approve") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  await connectDB();
  const business = await BusinessModel.findById(id);
  if (!business) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only a genuine pending→approved transition should fire a notification.
  // Re-approving an already-approved business, or approving a scraped one
  // with no owner, must not create a notification.
  const wasPending = business.status === "pending";
  business.status = "approved";
  await business.save();

  if (wasPending && business.userId) {
    await NotificationModel.create({
      userId: business.userId,
      type: "business_approved",
      businessName: business.name,
      link: `/services/${business.category}/${business._id}`,
    });
  }

  return NextResponse.json({ business: business.toObject() });
}

// Reject a submission (delete it).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await connectDB();
  const deleted = await BusinessModel.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
