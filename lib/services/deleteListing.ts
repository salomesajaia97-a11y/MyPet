import ListingModel from "@/lib/models/Listing";
import UserModel from "@/lib/models/User";

/**
 * Remove listing ids from every user's favorites.
 *
 * `User.favorites` is a plain array of listing refs with nothing keeping it in
 * step with the listings collection, so a deleted listing stayed in the array
 * forever. The favorites API populates and drops the dead refs, so nothing was
 * visibly broken — but the array grew monotonically for anyone who favourited
 * listings that later sold, and the ids were then re-sent to the client store
 * on every page load as favourites that no page can show.
 *
 * Exported separately because deleting a user removes their listings in bulk
 * and has to clean up other people's favorites the same way.
 */
export async function pullListingsFromFavorites(ids: unknown[]): Promise<void> {
  if (!ids.length) return;
  await UserModel.updateMany(
    { favorites: { $in: ids } },
    { $pull: { favorites: { $in: ids } } }
  );
}

/**
 * Delete a listing and the references that cannot outlive it.
 *
 * What goes: the favorites entries above.
 *
 * What stays, deliberately:
 * - message threads about the listing. `Thread.listingTitle` is a snapshot
 *   taken exactly so a conversation survives its listing, and both sides may
 *   still be arranging a handover after the seller marks the pet gone.
 *   Deleting a listing must not delete the other person's inbox.
 * - payments. They are the record of a real charge; applyVipForOrder already
 *   handles an order whose listing has gone.
 * - ListingView dedupe rows. They are keyed by an HMAC digest that cannot be
 *   queried by listing, and a TTL index reaps them within the day anyway.
 *
 * Listing last, so a failure in the cleanup leaves a retryable state rather
 * than a deleted listing still sitting in people's favorites.
 *
 * Returns false when there was no such listing.
 */
export async function deleteListingCascade(id: string): Promise<boolean> {
  const listing = await ListingModel.findById(id).select("_id").lean<{ _id: unknown } | null>();
  if (!listing) return false;

  await pullListingsFromFavorites([listing._id]);
  await ListingModel.deleteOne({ _id: id });
  return true;
}
