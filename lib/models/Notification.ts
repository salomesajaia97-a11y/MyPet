import { Schema, model, models, Types } from "mongoose";

/**
 * In-app notification for a single user. Currently emitted when an admin
 * approves a user-submitted business, but `type` keeps the model open to
 * other events. The display text is NOT stored — the UI renders it from the
 * i18n dictionary keyed by `type` so notifications follow the viewer's
 * language. `link` is where clicking the notification navigates, and
 * `businessName` fills the `{name}` slot in the localized message.
 */
const NotificationSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["business_approved"],
      required: true,
    },
    businessName: String,
    link: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

export default models.Notification || model("Notification", NotificationSchema);
