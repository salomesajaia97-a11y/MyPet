import { Schema, model, models } from "mongoose";

/**
 * One overridden piece of site copy.
 *
 * Overrides only — the dictionaries in lib/i18n/dictionaries stay the source of
 * truth and the fallback. A row exists exactly when someone has changed that
 * string in that language, so resetting a string means deleting its row rather
 * than storing the default back, and the collection stays small no matter how
 * many keys the dictionaries grow to.
 */
const SiteTextSchema = new Schema(
  {
    locale: { type: String, enum: ["ka", "en"], required: true },
    // Dot path into the dictionary, e.g. "listings.detail.call".
    key: { type: String, required: true },
    value: { type: String, required: true },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

// One override per string per language.
SiteTextSchema.index({ locale: 1, key: 1 }, { unique: true });

export default models.SiteText || model("SiteText", SiteTextSchema);
