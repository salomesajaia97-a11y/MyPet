"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2, ExternalLink } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface Upload {
  _id: string;
  publicId: string;
  url: string;
  uploadedBy?: string;
  createdAt: string;
}

export default function AdminUploadsPage() {
  const { t } = useT();
  const { confirm } = useConfirm();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/uploads")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setUploads(Array.isArray(d) ? d : []))
      .catch(() => setUploads([]))
      .finally(() => setLoading(false));
  }, []);

  async function deleteUpload(id: string) {
    const ok = await confirm({
      description: t.admin.uploads.deleteConfirm,
      confirmLabel: t.common.actions.delete,
      danger: true,
    });
    if (!ok) return;
    const res = await fetch(`/api/admin/uploads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUploads((prev) => prev.filter((u) => u._id !== id));
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.admin.uploads.title}</h1>
      {loading ? (
        <p className="text-gray-500">{t.admin.uploads.loading}</p>
      ) : uploads.length === 0 ? (
        <p className="text-gray-400">{t.admin.uploads.empty}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {uploads.map((u) => (
            <div
              key={u._id}
              className="group relative bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={u.url}
                  alt={u.publicId}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
              <div className="p-2">
                <p className="text-xs text-gray-400 truncate">{u.publicId}</p>
                <p className="text-xs text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={u.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded p-1 shadow text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => deleteUpload(u._id)}
                  className="bg-white rounded p-1 shadow text-gray-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
