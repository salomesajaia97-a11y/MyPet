import { Schema, model, models } from "mongoose";

const ReviewSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    source: { type: String, enum: ["google", "native"], required: true },
    reviewerName: { type: String, required: true },
    reviewerAvatar: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    googleReviewId: String,
    googleProfileUrl: String,
  },
  { timestamps: true }
);

ReviewSchema.index({ businessId: 1 });

export default models.Review || model("Review", ReviewSchema);
