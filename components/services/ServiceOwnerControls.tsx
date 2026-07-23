"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";

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
  const { t } = useT();
  const { confirm, notify } = useConfirm();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    const ok = await confirm({
      description: t.services.owner.deleteConfirm,
      confirmLabel: t.common.actions.delete,
      danger: true,
    });
    if (!ok) return;
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
      await notify({ description: t.services.owner.deleteFailed });
    }
  };

  return (
    <div className="flex gap-3">
      <Link
        href={`/services/${category}/${id}/edit`}
        className="flex-1 flex items-center justify-center gap-2 bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white font-semibold py-3 rounded-xl transition-colors"
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
        {deleting ? t.services.owner.deleting : t.common.actions.delete}
      </button>
    </div>
  );
}
