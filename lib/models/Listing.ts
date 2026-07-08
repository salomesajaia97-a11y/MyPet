import { Schema, model, models } from "mongoose";

const ListingSchema = new Schema(
  {
    type: { type: String, enum: ["buy-sell", "adoption", "mating", "lost-found"], required: true },
    species: { type: String, enum: ["dog", "cat", "bird", "rabbit", "reptile", "other"], required: true },
    breed: { type: String, required: true },
    age: { type: Number, required: true },
    images: [String],
    description: { type: String, required: true },
    location: { type: String, required: true },
    contactName: { type: String, required: true },
    contactPhone: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    // buy-sell & mating
    price: Number,
    currency: { type: String, enum: ["GEL", "USD"] },
    vaccinated: Boolean,
    hasPassport: Boolean,
    // adoption
    temperament: [String],
    spayedNeutered: Boolean,
    goodWithKids: Boolean,
    goodWithPets: Boolean,
    // mating
    sex: { type: String, enum: ["male", "female"] },
    weight: Number,
    // lost-found
    status: { type: String, enum: ["lost", "found"] },
    neighborhood: String,
    lastSeenDate: String,
    reward: Number,
    isResolved: { type: Boolean, default: false },
    // Paid VIP promotion. New listings default to non-VIP; `isVip` flips only
    // after payment (future) or an admin grant. `vipUntil` bounds the paid
    // period — null means no expiry. Homepage VIP row filters via isVipActive().
    isVip: { type: Boolean, default: false },
    vipUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

ListingSchema.index({ type: 1 });
ListingSchema.index({ species: 1 });
ListingSchema.index({ isVip: 1, vipUntil: 1, createdAt: -1 });

export default models.Listing || model("Listing", ListingSchema);
