import { Schema, model, models } from "mongoose";

/**
 * Site-wide configuration, editable from the panel.
 *
 * One document, pinned to `key: "site"` by a unique index, because there is
 * exactly one site. A singleton row rather than one row per setting keeps a
 * read to a single query and makes a partial write impossible: the panel saves
 * the whole shape or none of it.
 *
 * `vip` holds *overrides only*. An absent tier falls back to the code defaults
 * in vipPackages.ts, so a half-filled document can never leave a tier priceless.
 */
const SiteSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "site" },
    vip: {
      standard: { amount: Number, days: Number },
      super: { amount: Number, days: Number },
      ultra: { amount: Number, days: Number },
    },
    flags: {
      // Each defaults to on: an empty document must behave exactly like the
      // site did before settings existed.
      aiSearch: { type: Boolean, default: true },
      payments: { type: Boolean, default: true },
      registration: { type: Boolean, default: true },
    },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true }
);

export default models.SiteSetting || model("SiteSetting", SiteSettingSchema);
