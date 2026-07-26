"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/components/i18n/LanguageProvider";
import { formatGel, type VipTier } from "@/lib/marketplace/vipPackages";
import type { PaymentStatus } from "@/lib/models/Payment";

type Row = {
  _id: string;
  tier: VipTier;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  listingId: string | null;
  listingBreed: string | null;
};

export default function PaymentsPage() {
  const { t } = useT();
  const router = useRouter();
  const { status } = useSession();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profile/payments")
      .then((r) => r.json())
      .then(({ payments }) => setRows(payments ?? []))
      .catch(() => setRows([]));
  }, [status]);

  return (
    <div className="min-h-screen bg-[#EBF6FA] py-8">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-6 text-2xl font-bold text-[#0F2830]">{t.vip.payments.title}</h1>

        {rows === null ? (
          <div className="py-20 text-center text-sm text-stone-400">
            {t.common.actions.loading}
          </div>
        ) : rows.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-400">{t.vip.payments.empty}</div>
        ) : (
          <div className="divide-y divide-stone-100 overflow-hidden rounded-2xl bg-white shadow-sm">
            {rows.map((row) => (
              <div key={row._id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0F2830]">
                    {t.vip.tiers[row.tier].name}
                  </p>
                  <p className="truncate text-xs text-stone-500">
                    {new Date(row.createdAt).toLocaleDateString()}
                    {row.listingBreed ? ` · ${row.listingBreed}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#0F2830]">
                  {formatGel(row.amount)} {t.vip.gel}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                    row.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : row.status === "declined" || row.status === "expired"
                        ? "bg-red-50 text-red-600"
                        : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {t.vip.payments.statuses[row.status]}
                </span>
                {row.listingId && (
                  <Link
                    href={`/listings/${row.listingId}`}
                    className="shrink-0 text-xs font-semibold text-[#0E4A5C] underline"
                  >
                    {t.vip.payments.listing}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
