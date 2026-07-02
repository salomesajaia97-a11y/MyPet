"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

/**
 * Owner-only action toolbar for a listing. Rendered instead of the buyer
 * contact block when the logged-in user owns the listing. Edit routes to the
 * edit form; Delete hits the listing DELETE endpoint then sends the user back
 * to the section index.
 */
export function OwnerControls({
  id,
  backHref,
}: {
  id: string;
  backHref: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ განცხადების წაშლა?")) return;
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
      alert("წაშლა ვერ მოხერხდა. სცადეთ თავიდან.");
    }
  };

  return (
    <div className="border-t pt-5">
      <p className="text-sm font-semibold text-[#0F2830] mb-3">
        განცხადების მართვა
      </p>
      <div className="flex gap-3">
        <Link
          href={`/listings/${id}/edit`}
          className="flex-1 flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 text-[#0F2830] font-semibold py-3 rounded-xl transition-colors"
        >
          <Pencil className="w-4 h-4" />
          რედაქტირება
        </Link>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
        >
          <Trash2 className="w-4 h-4" />
          {deleting ? "იშლება…" : "წაშლა"}
        </button>
      </div>
    </div>
  );
}
