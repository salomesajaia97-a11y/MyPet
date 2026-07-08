"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Star, Sparkles } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

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
}: {
  id: string;
  backHref: string;
  isVip?: boolean;
}) {
  const { t } = useT();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t.listings.owner.deleteConfirm)) return;
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
      alert(t.listings.owner.deleteError);
    }
  };

  return (
    <div className="border-t pt-5">
      {/* Promote-to-VIP note. Placeholder for the future paid-promotion flow —
          the button is intentionally inert until checkout is wired up. Hidden
          once the listing is already VIP. */}
      {isVip ? (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-semibold text-amber-700">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          {t.listings.owner.vipActive}
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
              disabled
              title={t.listings.owner.soon}
              className="shrink-0 self-center cursor-not-allowed rounded-lg bg-amber-500/90 px-3 py-2 text-xs font-bold text-white opacity-80"
            >
              {t.listings.owner.promote}
            </button>
          </div>
        </div>
      )}

      <p className="text-sm font-semibold text-[#0F2830] mb-3">
        {t.listings.owner.manage}
      </p>
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
