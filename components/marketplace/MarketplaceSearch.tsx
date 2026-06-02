"use client";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export function MarketplaceSearch() {
  const [query, setQuery] = useState("");
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="ძებნა..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl text-sm placeholder:text-stone-400 focus:outline-none focus:border-[#6B5240]/50 focus:ring-2 focus:ring-[#6B5240]/10"
        />
      </div>
      <button className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-600 hover:border-[#6B5240]/50 hover:text-[#6B5240] transition-colors whitespace-nowrap">
        <SlidersHorizontal className="w-4 h-4" />
        ფილტრები
      </button>
    </div>
  );
}
