import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    source: { type: String, enum: ["google", "native"], required: true },
    // Author of a native review. Absent on legacy rows and Google reviews;
    // edit/delete/vote-guards are gated on its presence.
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    reviewerName: { type: String, required: true },
    reviewerAvatar: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    // Comment is optional — a star-only review is valid.
    text: { type: String, default: "" },
    // Cloudinary URLs attached to the review (max 3, enforced in the API).
    photos: { type: [String], default: [] },
    // Users who marked this review helpful. Count = length.
    helpfulUserIds: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    // Single reply from the business owner.
    ownerReply: {
      text: String,
      createdAt: Date,
      updatedAt: Date,
    },
    // Set when the author edits their review; drives an "edited" label.
    editedAt: Date,
    googleReviewId: String,
    googleProfileUrl: String,
  },
  { timestamps: true }
);

ReviewSchema.index({ businessId: 1 });

export default models.Review || model("Review", ReviewSchema);
