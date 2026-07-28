import BusinessModel from "@/lib/models/Business";
import ReviewModel from "@/lib/models/Review";
import NotificationModel from "@/lib/models/Notification";

/**
 * Delete a business and everything that only exists because of it.
 *
 * Two routes remove businesses — the admin moderation queue and the owner's
 * own delete — and both used to drop the document alone. Its reviews stayed
 * behind forever: nothing reads a review whose business is gone, so they were
 * invisible, uncountable and permanent. The approval notification pointed at a
 * page that now 404s, so that goes too.
 *
 * Shared rather than duplicated so the two callers cannot drift apart, and
 * ordered document-last: if the cascade fails the business is still there and
 * the delete can simply be retried, rather than leaving a live page whose
 * reviews have already been destroyed.
 *
 * Returns false when there was no such business.
 */
export async function deleteBusinessCascade(id: string): Promise<boolean> {
  const business = await BusinessModel.findById(id).lean<{
    _id: { toString(): string };
    category?: string;
  } | null>();
  if (!business) return false;

  await ReviewModel.deleteMany({ businessId: id });
  if (business.category) {
    await NotificationModel.deleteMany({ link: `/services/${business.category}/${id}` });
  }
  await BusinessModel.deleteOne({ _id: id });
  return true;
}
