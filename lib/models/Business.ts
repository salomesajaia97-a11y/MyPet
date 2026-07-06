import { Schema, model, models, Types } from "mongoose";

const BusinessSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"],
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    // Google Places-style scraped fields. placeId is unique so a re-scrape
    // upserts instead of duplicating. sparse: user-submitted docs have none.
    placeId: { type: String, unique: true, sparse: true },
    openingHours: [String],
    source: String,
    lat: Number,
    lng: Number,
    neighborhood: String,
    city: { type: String, required: true },
    phone: { type: String, required: true },
    website: String,
    images: [String],
    tags: [String],
    is24h: { type: Boolean, default: false },
    hasEmergency: { type: Boolean, default: false },
    pricePerNight: Number,
    capacity: Number,
    indoorAllowed: Boolean,
    // `googleRating` is the immutable Google/curated average; `aggregateRating`
    // is the blended display value (Google baseline + native reviews) and is
    // recomputed on every native review. Keeping the baseline separate stops a
    // native review from wiping the seeded Google score.
    googleRating: { type: Number, default: 0 },
    aggregateRating: { type: Number, default: 0 },
    googleRatingCount: { type: Number, default: 0 },
    nativeRatingCount: { type: Number, default: 0 },
    userId: { type: Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "approved"], default: "approved" },
  },
  { timestamps: true }
);

BusinessSchema.index({ category: 1 });

export default models.Business || model("Business", BusinessSchema);
