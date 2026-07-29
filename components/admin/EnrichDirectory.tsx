"use client";

import { useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

interface Report {
  applied: boolean;
  osmRows: number;
  matched: number;
  geocoded: number;
  geocodeSkipped: number;
  changed: number;
  fieldCounts: Record<string, number>;
  failures: string[];
  reports: { id: string; name: string; category: string; changes: Record<string, unknown> }[];
}

/**
 * Re-read OpenStreetMap for the imported directory rows and fill in what the
 * original import dropped.
 *
 * Two-step by design: the first press only previews. Writing to a hundred-odd
 * live pages is not something to do on one click, and the preview is also how
 * you notice if OSM has changed under you.
 */
export default function EnrichDirectory() {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);

  const run = async (apply: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/businesses/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setReport(await res.json());
    } catch {
      setError(t.admin.enrich.failed);
    } finally {
      setBusy(false);
    }
  };

  const FIELD_LABELS: Record<string, string> = {
    address: t.admin.enrich.fields.address,
    phone: t.admin.enrich.fields.phone,
    website: t.admin.enrich.fields.website,
    city: t.admin.enrich.fields.city,
    neighborhood: t.admin.enrich.fields.neighborhood,
    openingHours: t.admin.enrich.fields.openingHours,
    is24h: t.admin.enrich.fields.is24h,
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{t.admin.enrich.title}</p>
          <p className="text-sm text-gray-500 mt-0.5">{t.admin.enrich.description}</p>
        </div>
        <button
          onClick={() => run(false)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : undefined} />
          {busy ? t.admin.enrich.working : t.admin.enrich.preview}
        </button>
      </div>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {report && (
        <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
          <p className="text-sm text-gray-700">
            {report.applied ? t.admin.enrich.appliedSummary : t.admin.enrich.previewSummary}{" "}
            <strong>{report.changed}</strong> / {report.matched}
          </p>

          {Object.keys(report.fieldCounts).length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {Object.entries(report.fieldCounts).map(([field, count]) => (
                <li
                  key={field}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {FIELD_LABELS[field] ?? field}: {count}
                </li>
              ))}
            </ul>
          )}

          {report.geocodeSkipped > 0 && (
            // A per-run cap that says nothing reads as full coverage.
            <p className="text-xs text-amber-700">
              {t.admin.enrich.geocodeCapped} {report.geocodeSkipped}
            </p>
          )}

          {report.failures.length > 0 && (
            // A batch can fail on its own (Overpass rate-limits and 504s under
            // load) while the rest succeed — say so instead of implying the run
            // covered everything.
            <p className="text-xs text-amber-700">
              {t.admin.enrich.partial} {report.failures.length}
            </p>
          )}

          {report.changed > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                {t.admin.enrich.showRows}
              </summary>
              <ul className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                {report.reports.map((r) => (
                  <li key={r.id} className="text-xs text-gray-600">
                    <span className="font-medium text-gray-900">{r.name}</span>{" "}
                    {Object.entries(r.changes)
                      .map(
                        ([field, value]) =>
                          `${FIELD_LABELS[field] ?? field}: ${
                            Array.isArray(value) ? value.join(" / ") : String(value)
                          }`
                      )
                      .join(" · ")}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {!report.applied && report.changed > 0 && (
            <button
              onClick={() => run(true)}
              disabled={busy}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={14} />
              {t.admin.enrich.apply}
            </button>
          )}

          {/* ODbL requires attribution for data taken from OSM. */}
          <p className="text-xs text-gray-400">{t.admin.enrich.attribution}</p>
        </div>
      )}
    </div>
  );
}
