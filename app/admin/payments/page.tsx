"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/components/i18n/LanguageProvider";
import { formatGel } from "@/lib/marketplace/vipPackages";
import type { PaymentStatus } from "@/lib/models/Payment";

type Row = {
  _id: string;
  orderId: string;
  paymentId: number | null;
  tier: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  note: string | null;
  createdAt: string;
  user: string;
  listingId: string | null;
  listingBreed: string | null;
};

const STATUSES: (PaymentStatus | "")[] = [
  "",
  "approved",
  "declined",
  "created",
  "processing",
  "expired",
  "reversed",
];

export default function AdminPaymentsPage() {
  const { t } = useT();
  const [status, setStatus] = useState<PaymentStatus | "">("");
  // Store which filter the rows belong to instead of nulling them on every
  // change. That keeps loading derivable, avoids a synchronous setState inside
  // the effect, and stops a slow earlier response from overwriting a newer one.
  const [data, setData] = useState<{ status: PaymentStatus | ""; rows: Row[] } | null>(null);
  const rows = data && data.status === status ? data.rows : null;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/payments${status ? `?status=${status}` : ""}`)
      .then((r) => r.json())
      .then(({ payments }) => {
        if (!cancelled) setData({ status, rows: payments ?? [] });
      })
      .catch(() => {
        if (!cancelled) setData({ status, rows: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t.vip.payments.title}</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus | "")}
          aria-label={t.vip.payments.status}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "" ? t.vip.payments.all : t.vip.payments.statuses[s]}
            </option>
          ))}
        </select>
      </div>

      {rows === null ? (
        <p className="py-20 text-center text-sm text-gray-400">{t.common.actions.loading}</p>
      ) : rows.length === 0 ? (
        <p className="py-20 text-center text-sm text-gray-400">{t.vip.payments.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-[52rem] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">{t.vip.payments.date}</th>
                <th className="px-4 py-3">{t.vip.payments.user}</th>
                <th className="px-4 py-3">{t.vip.payments.listing}</th>
                <th className="px-4 py-3">{t.vip.payments.package}</th>
                <th className="px-4 py-3">{t.vip.payments.amount}</th>
                <th className="px-4 py-3">{t.vip.payments.status}</th>
                <th className="px-4 py-3">order_id</th>
                <th className="px-4 py-3">payment_id</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.user}</td>
                  <td className="px-4 py-3">
                    {r.listingId ? (
                      <Link href={`/listings/${r.listingId}`} className="text-[#0E4A5C] underline">
                        {r.listingBreed ?? r.listingId.slice(-6)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.tier}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">
                    {formatGel(r.amount)} {r.currency}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        r.status === "approved"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t.vip.payments.statuses[r.status]}
                    </span>
                    {/* Operational flag set by reconcile when a payload did not
                        match the stored order — needs a human. */}
                    {r.note && <span className="ml-2 text-xs text-red-600">{r.note}</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.orderId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {r.paymentId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
