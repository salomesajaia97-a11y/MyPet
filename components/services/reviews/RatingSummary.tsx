"use client";

import { Stars } from "./Stars";
import type { Review } from "./types";

// Header block: average, star row, total count, and a 5→1 distribution bar.
// Everything is derived from the real native review list, so it updates for
// free after any create/edit/delete. Renders "no ratings yet" at zero.
export default function RatingSummary({ reviews }: { reviews: Review[] }) {
  const count = reviews.length;

  if (count === 0) {
    return null;
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = sum / count;

  // Count per star level (5 → 1).
  const buckets = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 border border-stone-100 rounded-2xl p-4 bg-stone-50/50">
      {/* Average */}
      <div className="flex flex-col items-center justify-center shrink-0 sm:px-4">
        <span className="text-4xl font-bold text-[#0F2830]">{avg.toFixed(1)}</span>
        <Stars value={Math.round(avg)} className="w-4 h-4" />
        <span className="text-xs text-stone-400 mt-1">{count} შეფასება</span>
      </div>

      {/* Distribution */}
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {buckets.map(({ star, n }) => {
          const pct = count > 0 ? Math.round((n / count) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-stone-500 tabular-nums">{star}</span>
              <div className="flex-1 h-2 rounded-full bg-stone-200 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right text-stone-400 tabular-nums">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
