import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import BusinessModel from "@/lib/models/Business";
import NotificationModel from "@/lib/models/Notification";
import { deleteBusinessCascade } from "@/lib/services/deleteBusiness";
import { logAdminAction, requireAdmin } from "@/lib/admin/guard";
import { submitToIndexNow } from "@/lib/seo/indexNow";

// Move a business between the queue and the live directory. `approve` publishes
// a pending submission; `unpublish` sends a live one back to pending, which is
// the reversible alternative to deleting a business that needs attention.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAdmin();
  if (!actor) {
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
  if (action !== "approve" && action !== "unpublish") {
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
  business.status = action === "approve" ? "approved" : "pending";
  await business.save();

  if (action === "approve" && wasPending && business.userId) {
    await NotificationModel.create({
      userId: business.userId,
      type: "business_approved",
      businessName: business.name,
      link: `/services/${business.category}/${business._id}`,
    });
  }

  // Either direction is a change to a public URL: an approval makes the page
  // real, an unpublish makes it a 404 that should leave the index.
  submitToIndexNow([
    `/services/${business.category}/${business._id.toString()}`,
    `/services/${business.category}`,
  ]);

  await logAdminAction(actor, `business.${action}`, {
    type: "business",
    id,
    summary: `${action === "approve" ? "Published" : "Unpublished"} ${business.name ?? "a business"}`,
  });

  return NextResponse.json({ business: business.toObject() });
}

// Reject a submission (delete it).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await requireAdmin();
  if (!actor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await connectDB();
  // Named before the cascade runs — afterwards there is nothing left to read.
  const doomed = await BusinessModel.findById(id)
    .select("name category")
    .lean<{ name?: string; category?: string } | null>();
  // Takes the business's reviews and approval notification with it.
  const deleted = await deleteBusinessCascade(id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (doomed?.category) {
    submitToIndexNow([`/services/${doomed.category}/${id}`, `/services/${doomed.category}`]);
  }
  await logAdminAction(actor, "business.delete", {
    type: "business",
    id,
    summary: `Deleted ${doomed?.name ?? "a business"} and its reviews`,
  });
  return NextResponse.json({ success: true });
}
