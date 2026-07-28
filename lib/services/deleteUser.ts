import UserModel from "@/lib/models/User";
import ListingModel from "@/lib/models/Listing";
import BusinessModel from "@/lib/models/Business";
import ReviewModel from "@/lib/models/Review";
import ThreadModel from "@/lib/models/Thread";
import MessageModel from "@/lib/models/Message";
import NotificationModel from "@/lib/models/Notification";
import { recomputeBusinessRating } from "@/lib/recomputeRating";

/**
 * Delete a user and the content that cannot survive without them.
 *
 * Deleting the account alone left everything they had posted live and
 * unmanageable: their listings still appeared in the feeds with a working
 * "message seller" box pointing at an account that no longer exists, their
 * reviews still counted towards business ratings with no author to appeal to,
 * and their conversations sat in the other party's inbox forever. Removing a
 * spam account without removing the spam is not a delete.
 *
 * What goes:
 * - listings, and the threads/messages attached to any of them
 * - reviews, with every affected business's rating recomputed afterwards
 * - businesses still awaiting moderation (nobody is left to answer for them)
 * - threads they took part in, plus those threads' messages
 * - their notifications
 *
 * What stays:
 * - businesses already approved. These are real places with reviews and
 *   traffic; they lose their owner (`userId` unset) and read like the scraped
 *   directory entries, which is recoverable. Deleting them would take a live
 *   public page down as a side effect of an account action.
 * - payments. They are the financial record of a real charge and must outlive
 *   the account; applyVipForOrder already copes with a listing that is gone.
 *
 * Returns false when there was no such user.
 */
export async function deleteUserCascade(id: string): Promise<boolean> {
  const user = await UserModel.findById(id).lean<{ _id: unknown } | null>();
  if (!user) return false;

  // Reviews first: capture which businesses need recomputing before the rows
  // disappear, otherwise the ratings keep counting a deleted author's stars.
  const reviews = await ReviewModel.find({ userId: id })
    .select("businessId")
    .lean<{ businessId: { toString(): string } }[]>();
  const affected = [...new Set(reviews.map((r) => r.businessId.toString()))];
  await ReviewModel.deleteMany({ userId: id });
  for (const businessId of affected) {
    await recomputeBusinessRating(businessId);
  }

  // Their listings, and any conversation about one of them — the other party's
  // inbox should not keep a thread whose listing and counterpart are both gone.
  const listings = await ListingModel.find({ userId: id })
    .select("_id")
    .lean<{ _id: unknown }[]>();
  const listingIds = listings.map((l) => l._id);
  if (listingIds.length) {
    const threads = await ThreadModel.find({ listingId: { $in: listingIds } })
      .select("_id")
      .lean<{ _id: unknown }[]>();
    await MessageModel.deleteMany({ threadId: { $in: threads.map((t) => t._id) } });
    await ThreadModel.deleteMany({ listingId: { $in: listingIds } });
    await ListingModel.deleteMany({ _id: { $in: listingIds } });
  }

  // Threads they were a party to on someone else's listing.
  const ownThreads = await ThreadModel.find({ $or: [{ buyerId: id }, { ownerId: id }] })
    .select("_id")
    .lean<{ _id: unknown }[]>();
  if (ownThreads.length) {
    await MessageModel.deleteMany({ threadId: { $in: ownThreads.map((t) => t._id) } });
    await ThreadModel.deleteMany({ _id: { $in: ownThreads.map((t) => t._id) } });
  }

  await BusinessModel.deleteMany({ userId: id, status: "pending" });
  await BusinessModel.updateMany({ userId: id }, { $unset: { userId: "" } });
  await NotificationModel.deleteMany({ userId: id });

  // The account last, so a failure anywhere above leaves a retryable state
  // rather than a deleted user with live content still attached to their id.
  await UserModel.deleteOne({ _id: id });
  return true;
}
