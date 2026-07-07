"use client";

import { useState } from "react";
import { ThumbsUp, Pencil, Trash2, CornerDownRight } from "lucide-react";
import { Stars } from "./Stars";
import ReviewForm from "./ReviewForm";
import type { Review, ReviewDraft } from "./types";

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("ka-GE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  review: Review;
  currentUserId?: string;
  isOwner: boolean;
  onEdit: (id: string, draft: ReviewDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onVote: (id: string) => Promise<void>;
  onReply: (id: string, text: string) => Promise<void>;
  onDeleteReply: (id: string) => Promise<void>;
}

export default function ReviewCard({
  review,
  currentUserId,
  isOwner,
  onEdit,
  onDelete,
  onVote,
  onReply,
  onDeleteReply,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.ownerReply?.text ?? "");
  const [busy, setBusy] = useState(false);

  const isAuthor =
    review.source === "native" && !!review.userId && review.userId === currentUserId;
  const helpfulCount = review.helpfulUserIds?.length ?? 0;
  const voted = !!currentUserId && (review.helpfulUserIds ?? []).includes(currentUserId);
  const canVote = !!currentUserId && !isAuthor;

  if (editing) {
    return (
      <div className="border-t pt-4 first:border-t-0 first:pt-0">
        <ReviewForm
          initial={{ rating: review.rating, text: review.text ?? "", photos: review.photos ?? [] }}
          submitLabel="განახლება"
          onSubmit={async (draft) => {
            await onEdit(review._id, draft);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="border-t pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0E4A5C]/10 text-[#0E4A5C] flex items-center justify-center text-xs font-semibold overflow-hidden">
            {review.reviewerAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={review.reviewerAvatar} alt={review.reviewerName} className="w-full h-full object-cover" />
            ) : (
              initials(review.reviewerName)
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-[#0F2830] leading-tight">{review.reviewerName}</p>
            <p className="text-xs text-stone-400">
              {formatDate(review.createdAt)}
              {review.editedAt && <span className="ml-1">(რედაქტირებული)</span>}
            </p>
          </div>
        </div>
        <Stars value={review.rating} className="w-3.5 h-3.5" />
      </div>

      {review.text && (
        <p className="text-sm text-stone-600 leading-relaxed mt-2 whitespace-pre-line">{review.text}</p>
      )}

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {review.photos.map((url) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
            </a>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-3">
        <button
          type="button"
          disabled={!canVote || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onVote(review._id);
            } finally {
              setBusy(false);
            }
          }}
          className={`inline-flex items-center gap-1.5 text-xs transition-colors ${
            voted ? "text-[#0E4A5C] font-semibold" : "text-stone-400 hover:text-[#0E4A5C]"
          } disabled:cursor-default disabled:hover:text-stone-400`}
        >
          <ThumbsUp className={`w-3.5 h-3.5 ${voted ? "fill-[#0E4A5C]" : ""}`} />
          სასარგებლო{helpfulCount > 0 ? ` (${helpfulCount})` : ""}
        </button>

        {isAuthor && (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-[#0E4A5C] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> რედაქტირება
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!confirm("წავშალო შეფასება?")) return;
                setBusy(true);
                try {
                  await onDelete(review._id);
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> წაშლა
            </button>
          </>
        )}
      </div>

      {/* Owner reply */}
      {review.ownerReply?.text && !replying && (
        <div className="mt-3 ml-6 border-l-2 border-[#0E4A5C]/20 pl-3">
          <p className="text-xs font-semibold text-[#0E4A5C] flex items-center gap-1">
            <CornerDownRight className="w-3 h-3" /> ბიზნესის პასუხი
          </p>
          <p className="text-sm text-stone-600 mt-1 whitespace-pre-line">{review.ownerReply.text}</p>
          {isOwner && (
            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => {
                  setReplyText(review.ownerReply?.text ?? "");
                  setReplying(true);
                }}
                className="text-xs text-stone-400 hover:text-[#0E4A5C]"
              >
                რედაქტირება
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await onDeleteReply(review._id);
                  } finally {
                    setBusy(false);
                  }
                }}
                className="text-xs text-stone-400 hover:text-red-600"
              >
                წაშლა
              </button>
            </div>
          )}
        </div>
      )}

      {/* Owner reply form */}
      {isOwner && (replying || !review.ownerReply?.text) && (
        <div className="mt-3 ml-6">
          {replying ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="უპასუხე ამ შეფასებას…"
                className="w-full rounded-lg border border-stone-200 p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0E4A5C]/30"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || replyText.trim().length < 1}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await onReply(review._id, replyText.trim());
                      setReplying(false);
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="bg-[#0E4A5C] text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60"
                >
                  პასუხის გაგზავნა
                </button>
                <button
                  type="button"
                  onClick={() => setReplying(false)}
                  className="text-xs text-stone-500 px-2"
                >
                  გაუქმება
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="text-xs text-[#0E4A5C] font-medium hover:underline inline-flex items-center gap-1"
            >
              <CornerDownRight className="w-3 h-3" /> პასუხის გაცემა
            </button>
          )}
        </div>
      )}
    </div>
  );
}
