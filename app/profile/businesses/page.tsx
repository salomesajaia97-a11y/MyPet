"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface Business {
  _id: string;
  category: "vet-clinics" | "pet-hotels" | "pet-shops" | "pet-friendly";
  name: string;
  city?: string;
  address?: string;
  images?: string[];
  status: "pending" | "approved";
}

export default function MyBusinessesPage() {
  const { t } = useT();
  const router = useRouter();
  const { status } = useSession();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile/businesses")
      .then((r) => r.json())
      .then(({ businesses }) => setBusinesses(businesses ?? []))
      .catch(() => setBusinesses([]));
  }, [status]);

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#0F2830]">{t.profile.businesses.title}</h1>
          <Link
            href="/services/new"
            className="flex items-center gap-1.5 border border-[#0E4A5C] text-[#0E4A5C] hover:bg-[#0E4A5C] hover:text-white transition-all rounded-lg px-4 py-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            {t.profile.businesses.add}
          </Link>
        </div>

        {businesses === null ? (
          <div className="py-20 text-center text-stone-400 text-sm">{t.common.actions.loading}</div>
        ) : businesses.length === 0 ? (
          <div className="py-20 text-center text-stone-400 text-sm">
            {t.profile.businesses.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {businesses.map((b) => (
              <BusinessCard key={b._id} business={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BusinessCard({ business }: { business: Business }) {
  const { t } = useT();
  const isPending = business.status === "pending";

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <Link href={`/services/${business.category}/${business._id}`} className="block">
        <div className="relative aspect-[4/3] bg-stone-100">
          {business.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.images[0]}
              alt={business.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
          )}
          <div
            className={
              "absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold " +
              (isPending
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700")
            }
          >
            {isPending ? t.profile.businesses.pending : t.profile.businesses.approved}
          </div>
        </div>
      </Link>
      <div className="p-4 space-y-2">
        <p className="font-bold text-[#0F2830] text-base">{business.name}</p>
        <p className="text-xs text-stone-400">
          {t.profile.businesses.categories[business.category]}
        </p>
        <Link
          href={`/services/${business.category}/${business._id}/edit`}
          className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0E4A5C] hover:underline"
        >
          <Pencil className="w-3.5 h-3.5" />
          {/* Reuse the common Edit label already present in the dictionary. */}
          {t.common.actions.edit}
        </Link>
      </div>
    </div>
  );
}
