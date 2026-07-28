"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Trash2, MapPin, Phone, ExternalLink, EyeOff, Pencil } from "lucide-react";
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

type Tab = "pending" | "approved";

/** Stable empty list, so the filter memo does not rerun on every render. */
const NO_ROWS: Business[] = [];

export default function AdminBusinessesPage() {
  const { t } = useT();
  const { confirm } = useConfirm();
  const CATEGORY_LABELS: Record<string, string> = {
    "vet-clinics": t.admin.businesses.categories.vetClinic,
    "pet-hotels": t.admin.businesses.categories.petHotel,
    "pet-shops": t.admin.businesses.categories.petShop,
    "pet-friendly": t.admin.businesses.categories.petFriendly,
  };
  const [tab, setTab] = useState<Tab>("pending");
  // Rows are tagged with the tab they were fetched for. Switching tabs then
  // shows the spinner as a plain render-time derivation, instead of the effect
  // clearing the previous tab's rows on its way in — which is a state update
  // during an effect and flashes the old list first.
  const [loaded, setLoaded] = useState<{ tab: Tab; items: Business[] } | null>(null);
  const businesses = loaded && loaded.tab === tab ? loaded.items : NO_ROWS;
  const loading = loaded?.tab !== tab;
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/businesses?status=${tab}`)
      .then((r) => (r.ok ? r.json() : { businesses: [] }))
      .then((d) => {
        if (!active) return;
        setLoaded({ tab, items: Array.isArray(d.businesses) ? d.businesses : [] });
      })
      .catch(() => {
        if (active) setLoaded({ tab, items: [] });
      });
    return () => {
      active = false;
    };
  }, [tab]);

  /** Drop a row locally after it has been approved or deleted server-side. */
  const dropRow = (id: string) =>
    setLoaded((prev) =>
      prev ? { ...prev, items: prev.items.filter((b) => b._id !== id) } : prev
    );

  // The approved list can run to hundreds of rows, so filter client-side —
  // the API already returns the whole page in one shot.
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return businesses;
    return businesses.filter((b) =>
      [b.name, b.city, b.address, CATEGORY_LABELS[b.category] ?? b.category]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses, q, t]);

  async function approve(id: string) {
    setBusyId(id);
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (res.ok) dropRow(id);
    setBusyId(null);
  }

  async function unpublish(id: string) {
    const ok = await confirm({
      description: t.admin.businesses.unpublishConfirm,
      confirmLabel: t.admin.businesses.unpublish,
    });
    if (!ok) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/businesses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unpublish" }),
    });
    // It leaves the Published tab for the Pending one, so drop it from this view.
    if (res.ok) dropRow(id);
    setBusyId(null);
  }

  async function remove(id: string) {
    const ok = await confirm({
      description:
        tab === "pending"
          ? t.admin.businesses.rejectConfirm
          : t.admin.businesses.deleteConfirm,
      confirmLabel:
        tab === "pending" ? t.admin.businesses.reject : t.common.actions.delete,
      danger: true,
    });
    if (!ok) return;
    setBusyId(id);
    const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
    if (res.ok) dropRow(id);
    setBusyId(null);
  }

  const emptyMessage = q.trim()
    ? t.admin.businesses.noMatches
    : tab === "pending"
      ? t.admin.businesses.noPending
      : t.admin.businesses.noPublished;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.admin.businesses.title}</h1>
      <p className="text-sm text-gray-500 mb-5">
        {t.admin.businesses.subtitle}
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          {(["pending", "approved"] as Tab[]).map((value) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                setQ("");
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                tab === value
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {value === "pending"
                ? t.admin.businesses.tabs.pending
                : t.admin.businesses.tabs.published}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.admin.businesses.searchPlaceholder}
          className="flex-1 min-w-[180px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-gray-500">{t.admin.businesses.loading}</p>
      ) : visible.length === 0 ? (
        <p className="text-gray-400">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((b) => (
            <div
              key={b._id}
              className="flex items-start gap-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4"
            >
              <div className="w-20 h-20 shrink-0 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
                {b.images?.[0] ? (
                  // Raw <img>: approved list can include scraped directory rows
                  // with external image hosts not in remotePatterns.
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
                {tab === "pending" ? (
                  <button
                    onClick={() => approve(b._id)}
                    disabled={busyId === b._id}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                    {t.admin.businesses.approve}
                  </button>
                ) : (
                  <>
                    <Link
                      href={`/services/${b.category}/${b._id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink size={14} />
                      {t.common.actions.view}
                    </Link>
                    {/* Sends it back to the moderation queue — the reversible
                        alternative to deleting a live directory entry. */}
                    <button
                      onClick={() => unpublish(b._id)}
                      disabled={busyId === b._id}
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-amber-700 hover:bg-amber-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <EyeOff size={14} />
                      {t.admin.businesses.unpublish}
                    </button>
                  </>
                )}
                {/* The owner's own edit form — an admin is allowed through it,
                    which is what makes every field editable from here. */}
                <Link
                  href={`/services/${b.category}/${b._id}/edit`}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                  {t.common.actions.edit}
                </Link>
                <button
                  onClick={() => remove(b._id)}
                  disabled={busyId === b._id}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-red-600 hover:bg-red-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {tab === "pending"
                    ? t.admin.businesses.reject
                    : t.common.actions.delete}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
