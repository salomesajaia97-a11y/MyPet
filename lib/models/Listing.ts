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
    pedigree: { type: String, enum: ["FCI", "FCG", "none"] },
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
  },
  { timestamps: true }
);

ListingSchema.index({ type: 1 });
ListingSchema.index({ species: 1 });

export default models.Listing || model("Listing", ListingSchema);
