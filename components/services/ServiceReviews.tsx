"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Star } from "lucide-react";

interface Review {
  _id: string;
  source: "google" | "native";
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface Props {
  businessId: string;
  aggregateRating: number;
  totalCount: number;
}

function Stars({ value, className = "w-4 h-4" }: { value: number; className?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${className} ${
            n <= value ? "fill-amber-400 text-amber-400" : "text-stone-300"
          }`}
        />
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ServiceReviews({ businessId, aggregateRating, totalCount }: Props) {
  const { status } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Fetch reviews for a business. Returns the list (or null on failure) so
  // callers decide what to do with state — no setState inside effects.
  const fetchReviews = useCallback(async (): Promise<Review[] | null> => {
    try {
      const res = await fetch(`/api/reviews?businessId=${businessId}`, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      return data.reviews ?? [];
    } catch {
      return null;
    }
  }, [businessId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await fetchReviews();
      if (!active) return;
      if (list) setReviews(list);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [fetchReviews]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("აირჩიეთ შეფასება");
      return;
    }
    if (text.trim().length < 10) {
      setError("შეფასება უნდა იყოს მინიმუმ 10 სიმბოლო");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, text }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "failed");
      }
      setRating(0);
      setText("");
      const list = await fetchReviews();
      if (list) setReviews(list);
    } catch {
      setError("შეფასების გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#0F2830]">შეფასებები</h2>
        {aggregateRating > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-bold text-[#0F2830]">{aggregateRating.toFixed(1)}</span>
            <span className="text-stone-400 text-xs">({totalCount})</span>
          </div>
        )}
      </div>

      {/* Native review list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-4">იტვირთება…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">
            ჯერ არავის დაუწერია შეფასება. იყავი პირველი!
          </p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="border-t pt-4 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0E4A5C]/10 text-[#0E4A5C] flex items-center justify-center text-xs font-semibold overflow-hidden">
                    {r.reviewerAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.reviewerAvatar} alt={r.reviewerName} className="w-full h-full object-cover" />
                    ) : (
                      initials(r.reviewerName)
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0F2830] leading-tight">
                      {r.reviewerName}
                    </p>
                    <p className="text-xs text-stone-400">
                      {new Date(r.createdAt).toLocaleDateString("ka-GE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <Stars value={r.rating} className="w-3.5 h-3.5" />
              </div>
              <p className="text-sm text-stone-600 leading-relaxed mt-2">{r.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Write a review */}
      <div className="border-t pt-5">
        {status === "authenticated" ? (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm font-semibold text-[#0F2830]">დაწერე შეფასება</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} ვარსკვლავი`}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(n)}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      n <= (hovered || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-stone-300 hover:text-amber-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={4}
              placeholder="გაგვიზიარე შენი გამოცდილება…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-xl border border-stone-200 p-3 text-sm text-[#0F2830] resize-none focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/30"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {submitting ? "იგზავნება…" : "შეფასების გაგზავნა"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-stone-500 text-center">
            შეფასების დასაწერად{" "}
            <Link href="/login" className="text-[#0E4A5C] font-semibold hover:underline">
              შედი სისტემაში
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
