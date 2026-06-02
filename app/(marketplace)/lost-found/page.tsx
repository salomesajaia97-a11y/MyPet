import { Suspense } from "react";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingFilters } from "@/components/marketplace/ListingFilters";

export default async function LostFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-2 h-8 bg-red-500 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold text-red-700">Lost &amp; Found</h1>
          <p className="text-muted-foreground text-sm">დაკარგული / ნაპოვნი</p>
        </div>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <Suspense fallback={null}>
            <ListingFilters type="lost-found" />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <ListingGrid listings={[]} type="lost-found" />
        </div>
      </div>
    </div>
  );
}
