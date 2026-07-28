"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface Field {
  value: string;
  default: string;
  overridden: boolean;
}
interface Item {
  key: string;
  ka: Field;
  en: Field;
}

type Locale = "ka" | "en";

/** Shown at once. The dictionaries run to hundreds of keys, and a page of a few
 *  dozen is what a person can actually scan — search narrows the rest. */
const PAGE = 40;

export default function AdminContentPage() {
  const { t } = useT();
  const { notify } = useConfirm();
  const [items, setItems] = useState<Item[] | null>(null);
  const [q, setQ] = useState("");
  const [onlyEdited, setOnlyEdited] = useState(false);
  const [page, setPage] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/text")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        if (active) setItems(Array.isArray(d.items) ? d.items : []);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const list = items ?? [];
    const needle = q.trim().toLowerCase();
    return list.filter((item) => {
      if (onlyEdited && !item.ka.overridden && !item.en.overridden) return false;
      if (!needle) return true;
      return (
        item.key.toLowerCase().includes(needle) ||
        item.ka.value.toLowerCase().includes(needle) ||
        item.en.value.toLowerCase().includes(needle)
      );
    });
  }, [items, q, onlyEdited]);

  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));

  const draftId = (key: string, locale: Locale) => `${locale}:${key}`;

  const currentValue = (item: Item, locale: Locale) =>
    drafts[draftId(item.key, locale)] ?? item[locale].value;

  const applyResult = (key: string, locale: Locale, value: string, overridden: boolean) => {
    setItems((prev) =>
      prev
        ? prev.map((item) =>
            item.key === key
              ? { ...item, [locale]: { ...item[locale], value, overridden } }
              : item
          )
        : prev
    );
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[draftId(key, locale)];
      return next;
    });
  };

  const save = async (item: Item, locale: Locale) => {
    const value = currentValue(item, locale);
    const id = draftId(item.key, locale);
    setBusy(id);
    try {
      const res = await fetch("/api/admin/text", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, key: item.key, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      applyResult(item.key, locale, data.value, true);
    } catch {
      await notify({ description: t.admin.content.error });
    } finally {
      setBusy(null);
    }
  };

  const reset = async (item: Item, locale: Locale) => {
    const id = draftId(item.key, locale);
    setBusy(id);
    try {
      const res = await fetch(
        `/api/admin/text?locale=${locale}&key=${encodeURIComponent(item.key)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      applyResult(item.key, locale, data.value, false);
    } catch {
      await notify({ description: t.admin.content.error });
    } finally {
      setBusy(null);
    }
  };

  if (!items) return <p className="text-gray-500">{t.admin.content.loading}</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.admin.content.title}</h1>
      <p className="text-sm text-gray-500 mb-5">{t.admin.content.subtitle}</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder={t.admin.content.searchPlaceholder}
          className="flex-1 min-w-[14rem] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        />
        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={onlyEdited}
            onChange={(e) => {
              setOnlyEdited(e.target.checked);
              setPage(0);
            }}
          />
          {t.admin.content.onlyEdited}
        </label>
        <span className="text-xs text-gray-400">
          {filtered.length} {t.admin.content.strings}
        </span>
      </div>

      <div className="space-y-3">
        {shown.map((item) => (
          <div key={item.key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <code className="text-xs text-gray-400">{item.key}</code>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(["ka", "en"] as Locale[]).map((locale) => {
                const id = draftId(item.key, locale);
                const value = currentValue(item, locale);
                const dirty = value !== item[locale].value;
                return (
                  <div key={locale}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                        {locale}
                      </span>
                      {item[locale].overridden && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {t.admin.content.editedBadge}
                        </span>
                      )}
                    </div>
                    <textarea
                      value={value}
                      rows={value.length > 80 ? 3 : 2}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!dirty || busy === id}
                        onClick={() => save(item, locale)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
                      >
                        <Save className="h-3 w-3" />
                        {t.admin.content.save}
                      </button>
                      {/* Always available on an overridden string: this is the
                          way back from a bad edit, so it must never be hidden
                          behind an unsaved-changes state. */}
                      {item[locale].overridden && (
                        <button
                          type="button"
                          disabled={busy === id}
                          onClick={() => reset(item, locale)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {t.admin.content.reset}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-40"
          >
            ←
          </button>
          <span className="text-sm text-gray-500">
            {page + 1} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-40"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
