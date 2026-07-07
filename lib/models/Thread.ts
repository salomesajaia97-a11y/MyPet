import { Schema, model, models } from "mongoose";

// One conversation between a listing owner and an interested buyer, scoped to a
// single listing. Unique on (listingId, buyerId) so a buyer has one thread per
// listing. `listingTitle` is snapshotted so the thread stays readable even if
// the listing is later deleted. `*ReadAt` are per-side read cursors used to
// compute unread counts.
const ThreadSchema = new Schema(
  {
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    listingTitle: { type: String, required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessageAt: { type: Date, default: Date.now },
    lastMessageBody: { type: String, default: "" },
    buyerReadAt: { type: Date, default: null },
    ownerReadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ThreadSchema.index({ listingId: 1, buyerId: 1 }, { unique: true });
ThreadSchema.index({ ownerId: 1, lastMessageAt: -1 });
ThreadSchema.index({ buyerId: 1, lastMessageAt: -1 });

export default models.Thread || model("Thread", ThreadSchema);
