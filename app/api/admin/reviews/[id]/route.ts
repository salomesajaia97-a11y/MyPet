import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { connectDB } from "@/lib/db";
import ReviewModel from "@/lib/models/Review";
import { recomputeBusinessRating } from "@/lib/recomputeRating";
import { logAdminAction, requireAdmin } from "@/lib/admin/guard";

/** Short, recognisable description of a review for the audit log. */
function describe(review: { reviewerName?: string; rating?: number }): string {
  return `${review.rating ?? "?"}★ by ${review.reviewerName ?? "unknown"}`;
}

/**
 * Moderate a single review.
 *
 * `hide` / `unhide` is the reversible decision — the row stays, but it leaves
 * the public list and stops counting towards the rating. `removeReply` exists
 * separately because the owner's reply can be the abusive half of an otherwise
 * legitimate review. Both recompute the business rating, since hiding changes
 * the visible average and removing a reply does not.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let action: unknown;
  try {
    ({ action } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (action !== "hide" && action !== "unhide" && action !== "removeReply") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  try {
    await connectDB();
    const review = await ReviewModel.findById(id);
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "removeReply") {
      if (!review.ownerReply?.text) {
        return NextResponse.json({ error: "This review has no reply" }, { status: 409 });
      }
      review.ownerReply = undefined;
      await review.save();
      await logAdminAction(actor, "review.removeReply", {
        type: "review",
        id,
        summary: `Removed the owner reply on ${describe(review)}`,
      });
      return NextResponse.json({ ok: true, hidden: !!review.hidden });
    }

    const hide = action === "hide";
    review.hidden = hide;
    review.hiddenAt = hide ? new Date() : null;
    review.hiddenBy = hide ? actor.id : null;
    await review.save();
    // The average is derived from visible reviews, so it has to move with this.
    await recomputeBusinessRating(review.businessId);

    await logAdminAction(actor, hide ? "review.hide" : "review.unhide", {
      type: "review",
      id,
      summary: `${hide ? "Hid" : "Restored"} ${describe(review)}`,
    });
    return NextResponse.json({ ok: true, hidden: hide });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Delete a review outright — the permanent option, for spam and abuse. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireAdmin();
  if (!actor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!isValidObjectId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const review = await ReviewModel.findById(id);
    if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const businessId = review.businessId;
    const summary = describe(review);
    await review.deleteOne();
    await recomputeBusinessRating(businessId);

    await logAdminAction(actor, "review.delete", {
      type: "review",
      id,
      summary: `Deleted ${summary}`,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
