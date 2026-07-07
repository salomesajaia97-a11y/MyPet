"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import RatingSummary from "./reviews/RatingSummary";
import ReviewForm from "./reviews/ReviewForm";
import ReviewCard from "./reviews/ReviewCard";
import type { Review, ReviewDraft } from "./reviews/types";

interface Props {
  businessId: string;
  // The business owner (submitter). Absent for scraped businesses → no replies.
  ownerId?: string;
}

export default function ServiceReviews({ businessId, ownerId }: Props) {
  const { data: session, status } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;
  const isOwner = !!currentUserId && !!ownerId && currentUserId === ownerId;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

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

  const refresh = useCallback(async () => {
    const list = await fetchReviews();
    if (list) setReviews(list);
  }, [fetchReviews]);

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

  const createReview = async (draft: ReviewDraft) => {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, ...draft }),
    });
    if (!res.ok) throw new Error("failed");
    await refresh();
  };

  const editReview = async (id: string, draft: ReviewDraft) => {
    const res = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error("failed");
    await refresh();
  };

  const deleteReview = async (id: string) => {
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("failed");
    await refresh();
  };

  const voteHelpful = async (id: string) => {
    const res = await fetch(`/api/reviews/${id}/helpful`, { method: "POST" });
    if (!res.ok) throw new Error("failed");
    await refresh();
  };

  const replyToReview = async (id: string, text: string) => {
    const res = await fetch(`/api/reviews/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("failed");
    await refresh();
  };

  const deleteReply = async (id: string) => {
    const res = await fetch(`/api/reviews/${id}/reply`, { method: "DELETE" });
    if (!res.ok) throw new Error("failed");
    await refresh();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
      <h2 className="text-lg font-bold text-[#0F2830]">შეფასებები</h2>

      {!loading && reviews.length > 0 && <RatingSummary reviews={reviews} />}

      {/* Review list */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-stone-400 text-center py-4">იტვირთება…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-4">
            ჯერ არავის დაუწერია შეფასება. იყავი პირველი!
          </p>
        ) : (
          reviews.map((r) => (
            <ReviewCard
              key={r._id}
              review={r}
              currentUserId={currentUserId}
              isOwner={isOwner}
              onEdit={editReview}
              onDelete={deleteReview}
              onVote={voteHelpful}
              onReply={replyToReview}
              onDeleteReply={deleteReply}
            />
          ))
        )}
      </div>

      {/* Write a review */}
      <div className="border-t pt-5">
        {status === "authenticated" ? (
          <>
            <p className="text-sm font-semibold text-[#0F2830] mb-4">დაწერე შეფასება</p>
            <ReviewForm submitLabel="შეფასების გაგზავნა" onSubmit={createReview} />
          </>
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
