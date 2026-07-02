"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SPECIES, CITIES } from "@/lib/marketplace/filters";

/**
 * Results-page search bar. Reads the active filters straight from the URL so it
 * always reflects whatever the user searched (from the home quick-search or a
 * previous edit here), and stays fully editable. Submitting rewrites the URL
 * query, which re-runs the server-side listing fetch.
 *
 * `filters` toggles the species/city dropdowns — the marketplace pages pass it;
 * the services pages keep the plain text-only bar.
 */
export function MarketplaceSearch({ filters = false }: { filters?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Seed local state from the URL so the bar shows the current search.
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const species = searchParams.get("species") ?? "";
  const city = searchParams.get("city") ?? "";

  const hasActiveFilter = Boolean(q || species || city);

  // Merge the given changes into the current query and navigate.
  const apply = (changes: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const clearAll = () => {
    setQ("");
    router.push(pathname);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="flex items-center gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="ძებნა ჯიშით..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm placeholder:text-stone-400 focus:outline-none focus:border-[#0E4A5C]/50 focus:ring-2 focus:ring-[#0E4A5C]/10"
          />
        </div>
        {filters ? (
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-3 bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
          >
            <Search className="w-4 h-4" />
            ძებნა
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:border-[#0E4A5C]/50 hover:text-[#0E4A5C] transition-colors whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4" />
            ფილტრები
          </button>
        )}
      </form>

      {filters && (
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={species}
            onChange={(e) => apply({ species: e.target.value })}
            className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-[#0F2830] focus:outline-none focus:border-[#0E4A5C]/50 cursor-pointer"
          >
            <option value="">ყველა ტიპი</option>
            {SPECIES.map((s) => (
              <option key={s.slug} value={s.ka}>
                {s.ka}
              </option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => apply({ city: e.target.value })}
            className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-[#0F2830] focus:outline-none focus:border-[#0E4A5C]/50 cursor-pointer"
          >
            <option value="">ყველა ქალაქი</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-stone-500 hover:text-rose-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              გასუფთავება
            </button>
          )}
        </div>
      )}
    </div>
  );
}
