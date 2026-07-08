"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

/**
 * Owner-only action toolbar for a business/service detail page. Rendered when
 * the logged-in user owns the business (or is an admin). Edit routes to the
 * business edit form; Delete hits the business DELETE endpoint then returns to
 * the category index.
 */
export default function ServiceOwnerControls({
  category,
  id,
}: {
  category: string;
  id: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("დარწმუნებული ხართ, რომ გსურთ წაშლა?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/services/${category}/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete failed");
      router.push(`/services/${category}`);
      router.refresh();
    } catch {
      setDeleting(false);
      alert("წაშლა ვერ მოხერხდა. სცადეთ თავიდან.");
    }
  };

  return (
    <div className="flex gap-3">
      <Link
        href={`/services/${category}/${id}/edit`}
        className="flex-1 flex items-center justify-center gap-2 bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors"
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
        {deleting ? "იშლება..." : "წაშლა"}
      </button>
    </div>
  );
}
