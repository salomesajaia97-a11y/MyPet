import { Schema, model, models } from "mongoose";

/** Mirrors Flitt `order_status`. `created` is our own pre-redirect state. */
export type PaymentStatus =
  | "created"
  | "processing"
  | "approved"
  | "declined"
  | "expired"
  | "reversed";

/**
 * One VIP promotion purchase.
 *
 * `orderId` is merchant-generated and unique — it is the key Flitt echoes back
 * on every callback and the idempotency key for granting the promotion.
 * `appliedAt` is set exactly once, by a conditional update, so duplicate
 * callback deliveries cannot grant VIP twice.
 *
 * No card data ever reaches this app: the customer enters it on Flitt's hosted
 * page, and no `rectoken` is requested.
 */
const PaymentSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    listingId: { type: Schema.Types.ObjectId, ref: "Listing", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tier: { type: String, enum: ["standard", "super", "ultra"], required: true },
    // Duration snapshotted at purchase time. Repricing a package later must not
    // retroactively change what an in-flight order bought.
    days: { type: Number, required: true },
    amount: { type: Number, required: true }, // tetri
    currency: { type: String, default: "GEL" },
    status: {
      type: String,
      enum: ["created", "processing", "approved", "declined", "expired", "reversed"],
      default: "created",
    },
    paymentId: { type: Number, default: null },
    responseCode: { type: Number, default: null },
    responseDescription: { type: String, default: null },
    appliedAt: { type: Date, default: null },
    // Written alongside `appliedAt`, so a reversal can be undone precisely:
    // `grantedUntil` is the expiry this order produced (if the listing still
    // carries it, nothing has been bought since) and `previousVip` is the
    // listing's VIP state from just before the grant. `revokedAt` is the
    // idempotency guard on the way back out, mirroring `appliedAt`.
    grantedUntil: { type: Date, default: null },
    previousVip: { type: Schema.Types.Mixed, default: null },
    revokedAt: { type: Date, default: null },
    // Operational flag for support, e.g. "listingMissing", "amountMismatch".
    note: { type: String, default: null },
    raw: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ listingId: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

export default models.Payment || model("Payment", PaymentSchema);
