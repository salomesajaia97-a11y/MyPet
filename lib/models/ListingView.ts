import { Schema, model, models } from "mongoose";

/**
 * One row per (listing, visitor, day) that has already been counted. The row
 * exists purely to make `views` idempotent for a day — `key` is an HMAC digest
 * (see viewDedupeKey), so no IP or user agent is stored.
 *
 * The unique index is what enforces the rule: the second insert of the same key
 * fails with E11000 and the caller skips the increment. `expiresAt` carries a
 * TTL index so MongoDB reaps rows on its own and the collection stays about the
 * size of one day of traffic.
 */
const ListingViewSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: false }
);

// expireAfterSeconds: 0 means "delete once `expiresAt` is in the past".
ListingViewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default models.ListingView || model("ListingView", ListingViewSchema);
