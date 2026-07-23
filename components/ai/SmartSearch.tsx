"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useT } from "@/components/i18n/LanguageProvider";

/**
 * Natural-language search. Sends the query to /api/ai/search, which uses Claude
 * to parse it into structured filters, then redirects to the matching results.
 */
export function SmartSearch() {
  const router = useRouter();
  const { t } = useT();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const EXAMPLES = [
    t.misc.searchExample1,
    t.misc.searchExample2,
    t.misc.searchExample3,
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setError(t.misc.searchDisabled);
        return;
      }
      if (res.status === 401) {
        setError(t.misc.searchLoginRequired);
        return;
      }
      if (!res.ok || !data.redirect) {
        setError(data.error ?? t.misc.searchRetryReformulate);
        return;
      }
      router.push(data.redirect);
    } catch {
      setError(t.misc.searchRetry);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <form
        onSubmit={submit}
        className="flex items-stretch bg-white rounded-2xl border border-[#0E4A5C]/20 shadow-sm overflow-hidden focus-within:border-[#0E4A5C]/50 focus-within:ring-2 focus-within:ring-[#0E4A5C]/10 transition-all"
      >
        <span className="flex items-center pl-4 pr-1 text-[#0E4A5C]">
          <Sparkles className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.misc.searchPlaceholder}
          maxLength={300}
          className="flex-1 min-w-0 px-2 py-3 text-sm text-[#0F2830] placeholder:text-stone-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length < 2}
          className="bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white px-5 font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {loading ? t.misc.searching : t.misc.aiSearch}
        </button>
      </form>

      {error ? (
        <p className="text-xs text-rose-600 px-1">{error}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 px-1">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setQuery(ex)}
              className="text-[11px] text-stone-500 hover:text-[#0E4A5C] bg-white/70 border border-stone-200 rounded-full px-2.5 py-1 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
