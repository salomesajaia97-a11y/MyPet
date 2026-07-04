"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SPECIES, CITIES } from "@/lib/marketplace/filters";
import type { MarketplaceType } from "@/types/marketplace";

/**
 * Results-page search bar. Reads the active filters straight from the URL so it
 * always reflects whatever the user searched (from the home quick-search or a
 * previous edit here), and stays fully editable. Submitting rewrites the URL
 * query, which re-runs the server-side listing fetch.
 *
 * `filters` toggles the species/city dropdowns — the marketplace pages pass it;
 * the services pages keep the plain text-only bar. `type` unlocks the
 * type-specific advanced filters (price range, pedigree, lost/found status).
 */
export function MarketplaceSearch({
  filters = false,
  type,
}: {
  filters?: boolean;
  type?: MarketplaceType;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Seed local state from the URL so the bar shows the current search.
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [advanced, setAdvanced] = useState(
    Boolean(
      searchParams.get("minPrice") ||
        searchParams.get("maxPrice") ||
        searchParams.get("pedigree") ||
        searchParams.get("status") ||
        searchParams.get("sex")
    )
  );

  const species = searchParams.get("species") ?? "";
  const city = searchParams.get("city") ?? "";
  const pedigree = searchParams.get("pedigree") ?? "";
  const status = searchParams.get("status") ?? "";
  const sex = searchParams.get("sex") ?? "";

  const hasActiveFilter = Boolean(
    q || species || city || minPrice || maxPrice || pedigree || status || sex
  );

  const showPrice = type === "buy-sell" || type === "mating";
  const showPedigree = type === "buy-sell" || type === "mating";
  const showStatus = type === "lost-found";
  const showSex = type === "mating";

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
    setMinPrice("");
    setMaxPrice("");
    router.push(pathname);
  };

  // Price applies on Enter/blur (not per keystroke) to avoid a navigation storm.
  const applyPrice = () =>
    apply({
      minPrice: minPrice.trim(),
      maxPrice: maxPrice.trim(),
    });

  const selectClass =
    "px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-[#0F2830] focus:outline-none focus:border-[#0E4A5C]/50 cursor-pointer";

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
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-4 py-3 bg-[#0E4A5C] hover:bg-[#0B3D4E] text-white rounded-xl text-sm font-semibold transition-colors whitespace-nowrap"
        >
          <Search className="w-4 h-4" />
          ძება
        </button>
      </form>

      {filters && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={species}
              onChange={(e) => apply({ species: e.target.value })}
              className={selectClass}
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
              className={selectClass}
            >
              <option value="">ყველა ქალაქი</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Advanced-filter toggle — only when the type has extra filters. */}
            {(showPrice || showPedigree || showStatus || showSex) && (
              <button
                type="button"
                onClick={() => setAdvanced((v) => !v)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  advanced
                    ? "bg-[#0E4A5C] text-white border-[#0E4A5C]"
                    : "bg-white text-stone-600 border-stone-200 hover:border-[#0E4A5C]/50 hover:text-[#0E4A5C]"
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                ფილტრები
              </button>
            )}

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

          {/* Advanced filters panel */}
          {advanced && (showPrice || showPedigree || showStatus || showSex) && (
            <div className="flex items-end gap-3 flex-wrap bg-white border border-stone-200 rounded-xl p-4">
              {showPrice && (
                <>
                  <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
                    ფასი დან (₾)
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      onBlur={applyPrice}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyPrice();
                        }
                      }}
                      className="w-28 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0E4A5C]/50"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
                    ფასი მდე (₾)
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      placeholder="∞"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      onBlur={applyPrice}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyPrice();
                        }
                      }}
                      className="w-28 px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-[#0E4A5C]/50"
                    />
                  </label>
                </>
              )}

              {showPedigree && (
                <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
                  პედიგრი
                  <select
                    value={pedigree}
                    onChange={(e) => apply({ pedigree: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">ყველა</option>
                    <option value="FCI">FCI</option>
                    <option value="FCG">FCG</option>
                    <option value="none">პედიგრის გარეშე</option>
                  </select>
                </label>
              )}

              {showSex && (
                <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
                  სქესი
                  <select
                    value={sex}
                    onChange={(e) => apply({ sex: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">ყველა</option>
                    <option value="male">მამრი</option>
                    <option value="female">მდედრი</option>
                  </select>
                </label>
              )}

              {showStatus && (
                <label className="flex flex-col gap-1 text-xs font-medium text-stone-500">
                  სტატუსი
                  <select
                    value={status}
                    onChange={(e) => apply({ status: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">ყველა</option>
                    <option value="lost">დაკარგული</option>
                    <option value="found">ნაპოვნი</option>
                  </select>
                </label>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
