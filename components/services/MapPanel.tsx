"use client";

import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";
import type { BusinessData } from "@/lib/data/businesses";

// Leaflet touches `window` at import time — load it client-only.
const PetFriendlyMap = dynamic(() => import("./PetFriendlyMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#DDECF2]">
      <span className="text-[11px] text-[#0E4A5C]/60 font-medium">რუკა იტვირთება…</span>
    </div>
  ),
});

export function MapPanel({ businesses }: { businesses: BusinessData[] }) {
  return (
    <div className="lg:sticky lg:top-6">
      <div className="relative h-[320px] lg:h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-[#DDECF2] z-0">
        <PetFriendlyMap businesses={businesses} />
        {/* Overlay label — sits above the map tiles */}
        <div className="absolute top-4 left-4 z-[500] flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-sm pointer-events-none">
          <Navigation className="w-4 h-4 text-[#0E4A5C]" />
          <span className="text-xs font-semibold text-[#0F2830]">
            რუკა · {businesses.length} ადგილი
          </span>
        </div>
      </div>
    </div>
  );
}
