"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Trash2, CornerDownRight, ExternalLink, Star } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface AdminReview {
  _id: string;
  businessId: string;
  businessName: string;
  businessCategory: string | null;
  source: string;
  reviewerName: string;
  rating: number;
  text: string;
  photoCount: number;
  hidden: boolean;
  ownerReply: string | null;
  createdAt: string;
}

type State = "all" | "visible" | "hidden";

/** Stable empty list so the filter memo does not rerun on every render. */
const NO_ROWS: AdminReview[] = [];

export default function AdminReviewsPage() {
  const { t } = useT();
  const { confirm, notify } = useConfirm();
  const [state, setState] = useState<State>("all");
  const [rating, setRating] = useState<number | null>(null);
  // Rows carry the query they came from, so switching filters shows the loading
  // line as a render-time derivation instead of an effect clearing state.
  const [loaded, setLoaded] = useState<{ key: string; items: AdminReview[] } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const key = `${state}:${rating ?? ""}`;
  const reviews = loaded && loaded.key === key ? loaded.items : NO_ROWS;
  const loading = loaded?.key !== key;

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (state !== "all") params.set("state", state);
    if (rating) params.set("rating", String(rating));
    fetch(`/api/admin/reviews?${params}`)
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .then((d) => {
        if (!active) return;
        setLoaded({ key, items: Array.isArray(d.reviews) ? d.reviews : [] });
      })
      .catch(() => {
        if (active) setLoaded({ key, items: [] });
      });
    return () => {
      active = false;
    };
  }, [key, state, rating]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return reviews;
    return reviews.filter((r) =>
      [r.businessName, r.reviewerName, r.text]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle))
    );
  }, [reviews, q]);

  const patch = async (id: string, action: "hide" | "unhide" | "removeReply") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("failed");
      setLoaded((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((r) =>
                r._id !== id
                  ? r
                  : action === "removeReply"
                    ? { ...r, ownerReply: null }
                    : { ...r, hidden: action === "hide" }
              ),
            }
          : prev
      );
    } catch {
      await notify({ description: t.admin.reviews.actionError });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      description: t.admin.reviews.deleteConfirm,
      confirmLabel: t.common.actions.delete,
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setLoaded((prev) =>
        prev ? { ...prev, items: prev.items.filter((r) => r._id !== id) } : prev
      );
    } catch {
      await notify({ description: t.admin.reviews.actionError });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.admin.reviews.title}</h1>
      <p className="text-sm text-gray-500 mb-5">{t.admin.reviews.subtitle}</p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          {(["all", "visible", "hidden"] as State[]).map((value) => (
            <button
              key={value}
              onClick={() => setState(value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                state === value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.admin.reviews.tabs[value]}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          {[null, 1, 2, 3, 4, 5].map((value) => (
            <button
              key={value ?? "any"}
              onClick={() => setRating(value)}
              className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                rating === value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {value === null ? t.admin.reviews.anyRating : `${value}★`}
            </button>
          ))}
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.admin.reviews.searchPlaceholder}
          className="flex-1 min-w-[12rem] rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">{t.admin.reviews.loading}</p>
      ) : visible.length === 0 ? (
        <p className="text-gray-500">{t.admin.reviews.empty}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((r) => (
            <div
              key={r._id}
              className={`rounded-xl border bg-white p-4 shadow-sm ${
                r.hidden ? "border-amber-200 bg-amber-50/40" : "border-gray-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-900">
                      {r.rating}
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </span>
                    <span className="text-sm font-semibold text-gray-700">{r.reviewerName}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                    {r.source !== "native" && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {r.source}
                      </span>
                    )}
                    {r.hidden && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        {t.admin.reviews.hiddenBadge}
                      </span>
                    )}
                  </div>
                  {r.businessCategory ? (
                    <Link
                      href={`/services/${r.businessCategory}/${r.businessId}`}
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900"
                    >
                      {r.businessName}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  ) : (
                    <p className="mt-0.5 text-xs text-gray-500">{r.businessName}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={busyId === r._id}
                    onClick={() => patch(r._id, r.hidden ? "unhide" : "hide")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {r.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {r.hidden ? t.admin.reviews.unhide : t.admin.reviews.hide}
                  </button>
                  {r.ownerReply && (
                    <button
                      type="button"
                      disabled={busyId === r._id}
                      onClick={() => patch(r._id, "removeReply")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      {t.admin.reviews.removeReply}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === r._id}
                    onClick={() => remove(r._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t.common.actions.delete}
                  </button>
                </div>
              </div>

              {r.text && (
                <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{r.text}</p>
              )}
              {r.photoCount > 0 && (
                <p className="mt-1 text-xs text-gray-400">
                  {r.photoCount} {t.admin.reviews.photos}
                </p>
              )}
              {r.ownerReply && (
                <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  <span className="font-semibold text-gray-500">{t.admin.reviews.replyLabel}: </span>
                  {r.ownerReply}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
