"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Star, Sparkles, CheckCircle2, RotateCcw } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { PromoteDialog } from "@/components/vip/PromoteDialog";

/**
 * Owner-only action toolbar for a listing. Rendered instead of the buyer
 * contact block when the logged-in user owns the listing. Edit routes to the
 * edit form; Delete hits the listing DELETE endpoint then sends the user back
 * to the section index.
 */
export function OwnerControls({
  id,
  backHref,
  isVip = false,
  vipUntil = null,
  type,
  isResolved = false,
  autoPromote = false,
}: {
  id: string;
  backHref: string;
  isVip?: boolean;
  vipUntil?: string | null;
  type?: string;
  isResolved?: boolean;
  autoPromote?: boolean;
}) {
  const { t } = useT();
  const { confirm, notify } = useConfirm();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [resolved, setResolved] = useState(isResolved);
  const [resolving, setResolving] = useState(false);
  // Seeded from the query flag so the post-create upsell lands with the picker
  // already open.
  const [promoteOpen, setPromoteOpen] = useState(autoPromote);

  const toggleResolved = async () => {
    const next = !resolved;
    setResolving(true);
    try {
      const res = await fetch(`/api/marketplace/listing/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: next }),
      });
      if (!res.ok) throw new Error("resolve failed");
      setResolved(next);
      router.refresh();
    } catch {
      await notify({ description: t.listings.owner.resolveError });
    } finally {
      setResolving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      description: t.listings.owner.deleteConfirm,
      confirmLabel: t.common.actions.delete,
      danger: true,
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/marketplace/listing/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      router.push(backHref);
      router.refresh();
    } catch {
      setDeleting(false);
      await notify({ description: t.listings.owner.deleteError });
    }
  };

  return (
    <div className="border-t pt-5">
      {/* Paid promotion. Buying again while already VIP extends from the
          current expiry rather than restarting, so no paid time is lost. */}
      {isVip ? (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span>{t.listings.owner.vipActive}</span>
          {vipUntil && (
            <span className="text-xs font-medium text-amber-600">
              {t.listings.owner.vipUntil} {new Date(vipUntil).toLocaleDateString()}
            </span>
          )}
          <button
            type="button"
            onClick={() => setPromoteOpen(true)}
            className="ml-auto rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
          >
            {t.listings.owner.extend}
          </button>
        </div>
      ) : (
        <div className="mb-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-4 py-3.5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0F2830]">
                {t.listings.owner.promoteTitle}
              </p>
              <p className="mt-0.5 text-xs text-stone-500">
                {t.listings.owner.promoteDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPromoteOpen(true)}
              className="shrink-0 self-center rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600"
            >
              {t.listings.owner.promote}
            </button>
          </div>
        </div>
      )}

      <PromoteDialog listingId={id} open={promoteOpen} onClose={() => setPromoteOpen(false)} />

      <p className="text-sm font-semibold text-[#0F2830] mb-3">
        {t.listings.owner.manage}
      </p>

      {/* Lost & Found: let the owner close the loop once the pet is found. */}
      {type === "lost-found" && (
        <button
          type="button"
          onClick={toggleResolved}
          disabled={resolving}
          className={`mb-3 w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 ${
            resolved
              ? "border border-slate-200 text-stone-600 hover:bg-slate-50"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {resolved ? (
            <>
              <RotateCcw className="w-4 h-4" />
              {t.listings.owner.markUnresolved}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              {t.listings.owner.markResolved}
            </>
          )}
        </button>
      )}

      <div className="flex gap-3">
        <Link
          href={`/listings/${id}/edit`}
          className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-[#0F2830] font-semibold py-3 rounded-xl transition-colors"
        >
          <Pencil className="w-4 h-4" />
          {t.common.actions.edit}
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? t.listings.owner.deleting : t.common.actions.delete}
        </button>
      </div>
    </div>
  );
}
