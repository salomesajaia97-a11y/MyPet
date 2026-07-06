"use client";
import { useMemo, useState } from "react";
import { Search, MapPin, X } from "lucide-react";
import { RealBusinessCard } from "@/components/services/RealBusinessCard";
import type { BusinessData } from "@/lib/data/businesses";

interface Props {
  businesses: BusinessData[];
  // Optional: retained for call-site clarity. The detail href is built from
  // each business's own `category`, so a mixed-category list (the /services
  // index) links each card correctly.
  category?: string;
}

// Client-side search for a services feed: filter by name (free text) and by
// city (dropdown built from the cities actually present in the data). Filtering
// happens in the browser over the already-loaded list — instant, no reloads.
export function ServicesSearch({ businesses }: Props) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const cities = useMemo(
    () =>
      Array.from(
        new Set(businesses.map((b) => b.city).filter((c): c is string => !!c))
      ).sort((a, b) => a.localeCompare(b, "ka")),
    [businesses]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return businesses.filter((b) => {
      const matchesName =
        !needle ||
        b.name.toLowerCase().includes(needle) ||
        b.nameKa?.toLowerCase().includes(needle);
      const matchesCity = !city || b.city === city || b.neighborhood === city;
      return matchesName && matchesCity;
    });
  }, [businesses, q, city]);

  const controlClass =
    "px-3 py-3 bg-white border border-stone-200 rounded-xl text-sm text-[#0F2830] focus:outline-none focus:border-[#0E4A5C]/50";

  return (
    <div className="space-y-4">
      {/* Search + city filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="ძებნა სახელით..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm placeholder:text-stone-400 focus:outline-none focus:border-[#0E4A5C]/50 focus:ring-2 focus:ring-[#0E4A5C]/10"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={`${controlClass} pl-9 cursor-pointer`}
            aria-label="ქალაქი"
          >
            <option value="">ყველა ქალაქი</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {(q || city) && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCity("");
            }}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm text-stone-500 hover:text-rose-600 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            გასუფთავება
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-sm text-stone-500 py-8 text-center">
          ვერაფერი მოიძებნა
        </p>
      ) : (
        <div className="space-y-4">
          {filtered.map((biz) => (
            <RealBusinessCard
              key={biz._id}
              business={biz}
              href={`/services/${biz.category}/${biz._id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
