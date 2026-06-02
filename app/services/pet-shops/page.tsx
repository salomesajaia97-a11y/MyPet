import { Suspense } from "react";
import { ServiceFilters } from "@/components/services/ServiceFilters";

export default function PetShopsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Pet Shops</h1>
        <p className="text-muted-foreground text-sm mt-1">Pet მაღაზიები</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <Suspense fallback={null}>
            <ServiceFilters category="pet-shops" />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <p className="text-muted-foreground col-span-full py-12 text-center">No listings yet — check back soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
