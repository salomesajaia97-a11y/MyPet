import { ReviewCard } from "./ReviewCard";
import { ReviewForm } from "./ReviewForm";
import { Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { Review } from "@/types/reviews";

interface Props {
  businessId: string;
  reviews: Review[];
  aggregateRating: number;
  totalCount: number;
}

export function ReviewList({ businessId, reviews, aggregateRating, totalCount }: Props) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Reviews &amp; Ratings</h2>
        <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-xl">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="font-bold text-lg">{aggregateRating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">/ 5 ({totalCount})</span>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewCard key={r._id} review={r} />
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No reviews yet. Be the first!</p>
        )}
      </div>

      <Separator />
      <ReviewForm businessId={businessId} />
    </section>
  );
}
