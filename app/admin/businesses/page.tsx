"use client";

import { useEffect, useState } from "react";
import { Check, Trash2, MapPin, Phone } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface Business {
  _id: string;
  name: string;
  category: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  images?: string[];
  createdAt: string;
}

export default function AdminBusinessesPage() {
  const { t } = useT();
  const { confirm } = useConfirm();
  const CATEGORY_LABELS: Record<string, string> = {
    "vet-clinics": t.admin.businesses.categories.vetClinic,
    "pet-hotels": t.admin.businesses.categories.petHotel,
    "pet-shops": t.admin.businesses.categories.petShop,
    "pet-friendly": t.admin.businesses.categories.petFriendly,
  };
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/businesses?status=pending")
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((d) => setBusinesses(Array.isArray(d.businesses) ? d.businesses : []))
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (res.ok) setBusinesses((prev) => prev.filter((b) => b._id !== id));
    setBusyId(null);
  }

  async function reject(id: string) {
    const ok = await confirm({
      description: t.admin.businesses.rejectConfirm,
      confirmLabel: t.admin.businesses.reject,
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
    if (res.ok) setBusinesses((prev) => prev.filter((b) => b._id !== id));
    setBusyId(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.admin.businesses.title}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {t.admin.businesses.subtitle}
      </p>

      {loading ? (
        <p className="text-gray-500">{t.admin.businesses.loading}</p>
      ) : businesses.length === 0 ? (
        <p className="text-gray-400">{t.admin.businesses.noPending}</p>
      ) : (
        <div className="space-y-3">
          {businesses.map((b) => (
            <div
              key={b._id}
              className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4"
            >
              <div className="w-20 h-20 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                {b.images?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.images[0]} alt={b.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🐾</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{b.name}</p>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {CATEGORY_LABELS[b.category] ?? b.category}
                  </span>
                </div>
                {b.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{b.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 flex-wrap">
                  {(b.address || b.city) && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {[b.address, b.city].filter(Boolean).join(", ")}
                    </span>
                  )}
                  {b.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} />
                      {b.phone}
                    </span>
                  )}
                  <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => approve(b._id)}
                  disabled={busyId === b._id}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Check size={14} />
                  {t.admin.businesses.approve}
                </button>
                <button
                  onClick={() => reject(b._id)}
                  disabled={busyId === b._id}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {t.admin.businesses.reject}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
