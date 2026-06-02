import { Suspense } from "react";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingFilters } from "@/components/marketplace/ListingFilters";

export default async function AdoptionPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Adoption</h1>
        <p className="text-muted-foreground text-sm mt-1">გაჩუქება</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <Suspense fallback={null}>
            <ListingFilters type="adoption" />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <ListingGrid listings={[]} type="adoption" />
        </div>
      </div>
    </div>
  );
}
