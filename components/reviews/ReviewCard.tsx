import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { GoogleBadge } from "./GoogleBadge";
import type { Review } from "@/types/reviews";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-3.5 h-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
        />
      ))}
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const initials = review.reviewerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={review.reviewerAvatar} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-tight">{review.reviewerName}</p>
              {review.source === "google" && <GoogleBadge />}
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(review.date).toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{review.text}</p>
    </div>
  );
}
