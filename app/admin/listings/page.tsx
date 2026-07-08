"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star, Pencil, Trash2, Check } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface Row {
  _id: string;
  type: string;
  breed: string;
  species: string;
  price: number | null;
  currency: string;
  image: string;
  location: string;
  status: string;
  isResolved: boolean;
  isVip: boolean;
  vipUntil: string | null;
  owner: string;
  createdAt: string;
}

export default function AdminListingsPage() {
  const { t } = useT();
  const TYPES = [
    { value: "", label: t.admin.listings.allTypes },
    { value: "buy-sell", label: t.admin.listingTypes.buySell },
    { value: "adoption", label: t.admin.listingTypes.adoption },
    { value: "mating", label: t.admin.listingTypes.mating },
    { value: "lost-found", label: t.admin.listingTypes.lostFound },
  ];
  const TYPE_LABEL: Record<string, string> = Object.fromEntries(TYPES.map((x) => [x.value, x.label]));

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const [submittedQ, setSubmittedQ] = useState(""); // applied search term
  const [busy, setBusy] = useState<string | null>(null);

  // Returns the rows for the current type + applied search — no setState, so it
  // can be awaited from the effect without a synchronous cascade.
  const fetchRows = useCallback(async (): Promise<Row[]> => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (submittedQ) params.set("q", submittedQ);
    try {
      const res = await fetch(`/api/admin/listings?${params.toString()}`);
      const data = res.ok ? await res.json() : { listings: [] };
      return Array.isArray(data.listings) ? data.listings : [];
    } catch {
      return [];
    }
  }, [type, submittedQ]);

  useEffect(() => {
    let active = true;
    fetchRows().then((data) => {
      if (active) {
        setRows(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [fetchRows]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(id);
    const res = await fetch(`/api/marketplace/listing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...body } : r)));
    }
    setBusy(null);
  }

  async function remove(id: string) {
    if (!confirm(t.admin.listings.deleteConfirm)) return;
    setBusy(id);
    const res = await fetch(`/api/marketplace/listing/${id}`, { method: "DELETE" });
    if (res.ok) setRows((prev) => prev.filter((r) => r._id !== id));
    setBusy(null);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{t.admin.listings.title}</h1>
      <p className="text-sm text-gray-500 mb-5">
        {t.admin.listings.subtitle}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmittedQ(q.trim());
        }}
        className="flex flex-wrap items-center gap-2 mb-4"
      >
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.admin.listings.searchPlaceholder}
          className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <button className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          {t.admin.listings.search}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">{t.admin.listings.loading}</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400">{t.admin.listings.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">{t.admin.listings.cols.photo}</th>
                <th className="px-3 py-2 font-medium">{t.admin.listings.cols.type}</th>
                <th className="px-3 py-2 font-medium">{t.admin.listings.cols.breed}</th>
                <th className="px-3 py-2 font-medium">{t.admin.listings.cols.price}</th>
                <th className="px-3 py-2 font-medium">{t.admin.listings.cols.owner}</th>
                <th className="px-3 py-2 font-medium">{t.admin.listings.cols.actions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t border-gray-100">
                  <td className="px-3 py-2">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                      {r.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.image} alt={r.breed} className="w-full h-full object-cover" />
                      ) : (
                        <span>🐾</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{TYPE_LABEL[r.type] ?? r.type}</td>
                  <td className="px-3 py-2 text-gray-900">
                    {r.breed}
                    {r.isVip && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> VIP
                      </span>
                    )}
                    {r.type === "lost-found" && r.isResolved && (
                      <span className="ml-2 text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {t.admin.listings.resolved}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap">
                    {r.price != null ? `${r.currency === "USD" ? "$" : "₾"}${r.price.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-gray-500 max-w-[140px] truncate">{r.owner}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/listings/${r._id}/edit`}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        title={t.admin.listings.actions.edit}
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => patch(r._id, { isVip: !r.isVip, vipUntil: null })}
                        disabled={busy === r._id}
                        title={r.isVip ? t.admin.listings.actions.removeVip : t.admin.listings.actions.grantVip}
                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          r.isVip
                            ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                            : "text-gray-500 hover:bg-gray-100 hover:text-amber-600"
                        }`}
                      >
                        <Star size={15} className={r.isVip ? "fill-amber-400" : ""} />
                      </button>
                      {r.type === "lost-found" && (
                        <button
                          onClick={() => patch(r._id, { isResolved: !r.isResolved })}
                          disabled={busy === r._id}
                          title={r.isResolved ? t.admin.listings.actions.markUnresolved : t.admin.listings.actions.markResolved}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                            r.isResolved
                              ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                              : "text-gray-500 hover:bg-gray-100 hover:text-emerald-600"
                          }`}
                        >
                          <Check size={15} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(r._id)}
                        disabled={busy === r._id}
                        title={t.admin.listings.actions.delete}
                        className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
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
