"use client";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SPECIES, CITIES } from "@/lib/marketplace/filters";
import { useT } from "@/components/i18n/LanguageProvider";
import type { MarketplaceType } from "@/types/marketplace";

/**
 * Results-page search + filter bar. Reads the active filters straight from the
 * URL so it always reflects the current search (from the home quick-search or a
 * previous edit here), and stays fully editable. Any change rewrites the URL
 * query, which re-runs the server-side listing fetch.
 *
 * `filters` toggles the filter row (the services pages keep a plain text bar).
 * `type` decides which type-specific filters show: price range for
 * buy-sell/mating, sex for mating, lost/found status for lost-found. All are
 * inline and always visible — no hidden panel.
 */
export function MarketplaceSearch({
  filters = false,
  type,
}: {
  filters?: boolean;
  type?: MarketplaceType;
}) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Seed local state from the URL so the bar shows the current search.
  const urlQ = searchParams.get("q") ?? "";
  const urlMin = searchParams.get("minPrice") ?? "";
  const urlMax = searchParams.get("maxPrice") ?? "";
  const [q, setQ] = useState(urlQ);
  const [minPrice, setMinPrice] = useState(urlMin);
  const [maxPrice, setMaxPrice] = useState(urlMax);

  // Resync the free-text inputs when the URL changes underneath us (browser
  // back/forward, or an external link). Done during render, keyed on the URL
  // values, so typing isn't clobbered (URL is unchanged while typing).
  const [syncedKey, setSyncedKey] = useState(`${urlQ}|${urlMin}|${urlMax}`);
  const urlKey = `${urlQ}|${urlMin}|${urlMax}`;
  if (urlKey !== syncedKey) {
    setSyncedKey(urlKey);
    setQ(urlQ);
    setMinPrice(urlMin);
    setMaxPrice(urlMax);
  }

  const species = searchParams.get("species") ?? "";
  const city = searchParams.get("city") ?? "";
  const status = searchParams.get("status") ?? "";
  const sex = searchParams.get("sex") ?? "";

  const hasActiveFilter = Boolean(
    q || species || city || minPrice || maxPrice || status || sex
  );

  const showPrice = type === "buy-sell" || type === "mating";
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
    apply({ minPrice: minPrice.trim(), maxPrice: maxPrice.trim() });

  const controlClass =
    "px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm text-[#0F2830] focus:outline-none focus:border-[#0E4A5C]/50";
  const priceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyPrice();
    }
  };

  return (
    <div className="space-y-3">
      {/* Row 1 — free-text breed search */}
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
            placeholder={t.marketplace.searchByBreedPlaceholder}
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
          {t.marketplace.searchButton}
        </button>
      </form>

      {/* Row 2 — always-visible filter controls */}
      {filters && (
        <div className="flex items-center gap-2 flex-wrap">
          {/* Animal type */}
          <select
            value={species}
            onChange={(e) => apply({ species: e.target.value })}
            className={`${controlClass} cursor-pointer`}
            aria-label={t.marketplace.speciesFilterLabel}
          >
            <option value="">{t.marketplace.allTypes}</option>
            {SPECIES.map((s) => (
              <option key={s.slug} value={s.ka}>
                {t.marketplace.species[s.slug]}
              </option>
            ))}
          </select>

          {/* City */}
          <select
            value={city}
            onChange={(e) => apply({ city: e.target.value })}
            className={`${controlClass} cursor-pointer`}
            aria-label={t.marketplace.cityFilterLabel}
          >
            <option value="">{t.marketplace.allCities}</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Price range (buy-sell / mating) */}
          {showPrice && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder={t.marketplace.priceFrom}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                onBlur={applyPrice}
                onKeyDown={priceKeyDown}
                className={`${controlClass} w-28`}
                aria-label={t.marketplace.minPriceLabel}
              />
              <span className="text-stone-300">–</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                placeholder={t.marketplace.priceTo}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={applyPrice}
                onKeyDown={priceKeyDown}
                className={`${controlClass} w-28`}
                aria-label={t.marketplace.maxPriceLabel}
              />
            </div>
          )}

          {/* Sex (mating) */}
          {showSex && (
            <select
              value={sex}
              onChange={(e) => apply({ sex: e.target.value })}
              className={`${controlClass} cursor-pointer`}
              aria-label={t.marketplace.sexFilterLabel}
            >
              <option value="">{t.marketplace.sexAll}</option>
              <option value="male">{t.marketplace.sexMale}</option>
              <option value="female">{t.marketplace.sexFemale}</option>
            </select>
          )}

          {/* Status (lost-found) */}
          {showStatus && (
            <select
              value={status}
              onChange={(e) => apply({ status: e.target.value })}
              className={`${controlClass} cursor-pointer`}
              aria-label={t.marketplace.statusFilterLabel}
            >
              <option value="">{t.marketplace.statusAll}</option>
              <option value="lost">{t.marketplace.statusLostOption}</option>
              <option value="found">{t.marketplace.statusFoundOption}</option>
            </select>
          )}

          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm text-stone-500 hover:text-rose-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              {t.marketplace.clearFilters}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
