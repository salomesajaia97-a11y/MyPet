import { Schema, model, models } from "mongoose";

/**
 * One entry in the admin audit trail.
 *
 * The panel can now edit, hide and delete anything on the site, which means a
 * single mistaken click is indistinguishable from normal traffic unless it is
 * recorded. Every admin mutation writes one of these, and `/admin/audit` reads
 * them back — this is what makes an accident diagnosable after the fact.
 *
 * `summary` is a short human sentence rather than a diff: the point is to make
 * the log skimmable ("hid a 1-star review of Vet Plus"), not to reconstruct
 * state. Deletions therefore record enough of the removed thing to recognise it.
 */
const AdminActionSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorEmail: { type: String, default: null },
    // Verb + object, e.g. "review.hide", "listing.update", "settings.update".
    action: { type: String, required: true },
    targetType: { type: String, default: null },
    // Not a ref: the target is often gone by the time anyone reads the log.
    targetId: { type: String, default: null },
    summary: { type: String, default: "" },
  },
  { timestamps: true }
);

AdminActionSchema.index({ createdAt: -1 });
AdminActionSchema.index({ action: 1, createdAt: -1 });

export default models.AdminAction || model("AdminAction", AdminActionSchema);
