import { Types } from "mongoose";
import ReviewModel from "@/lib/models/Review";
import BusinessModel from "@/lib/models/Business";

// Recompute a business's rating from REAL native reviews only. No Google
// baseline, no blend — the aggregate is the plain average of native review
// ratings (0 when there are none). Called after every create / edit / delete
// so the displayed rating always reflects genuine user reviews.
export async function recomputeBusinessRating(
  businessId: string | Types.ObjectId
): Promise<void> {
  const natives = await ReviewModel.find({ businessId, source: "native" })
    .select("rating")
    .lean();

  const nativeCount = natives.length;
  const sum = natives.reduce((acc, r) => acc + (r.rating ?? 0), 0);
  const avg = nativeCount > 0 ? sum / nativeCount : 0;

  await BusinessModel.findByIdAndUpdate(businessId, {
    aggregateRating: Math.round(avg * 10) / 10,
    nativeRatingCount: nativeCount,
    // Ensure the fabricated Google baseline can never resurface.
    googleRating: 0,
    googleRatingCount: 0,
  });
}
