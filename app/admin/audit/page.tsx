"use client";

import { useEffect, useState } from "react";
import { useT } from "@/components/i18n/LanguageProvider";

interface Entry {
  _id: string;
  actor: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  summary: string;
  createdAt: string;
}

/** Coarse groups, so a moderator can find "what happened to the reviews". */
const FILTERS = ["", "review", "listing", "business", "user", "upload", "settings", "text"] as const;

export default function AdminAuditPage() {
  const { t } = useT();
  const [filter, setFilter] = useState<string>("");
  const [loaded, setLoaded] = useState<{ key: string; items: Entry[] } | null>(null);

  const entries = loaded?.key === filter ? loaded.items : [];
  const loading = loaded?.key !== filter;

  useEffect(() => {
    let active = true;
    const qs = filter ? `?action=${encodeURIComponent(filter)}` : "";
    fetch(`/api/admin/audit${qs}`)
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => {
        if (active) setLoaded({ key: filter, items: Array.isArray(d.entries) ? d.entries : [] });
      })
      .catch(() => {
        if (active) setLoaded({ key: filter, items: [] });
      });
    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.admin.audit.title}</h1>
      <p className="text-sm text-gray-500 mb-5">{t.admin.audit.subtitle}</p>

      <div className="inline-flex flex-wrap rounded-lg border border-gray-200 bg-white p-0.5 mb-4">
        {FILTERS.map((value) => (
          <button
            key={value || "all"}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filter === value ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {value === "" ? t.admin.audit.all : value}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">{t.admin.audit.loading}</p>
      ) : entries.length === 0 ? (
        <p className="text-gray-500">{t.admin.audit.empty}</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">{t.admin.audit.when}</th>
                <th className="px-4 py-3 font-semibold">{t.admin.audit.who}</th>
                <th className="px-4 py-3 font-semibold">{t.admin.audit.action}</th>
                <th className="px-4 py-3 font-semibold">{t.admin.audit.what}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e._id}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.actor}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">
                      {e.action}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{e.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
