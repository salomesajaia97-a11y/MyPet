import { Suspense } from "react";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { RealBusinessCard } from "@/components/services/RealBusinessCard";
import { PET_HOTELS } from "@/lib/data/businesses";

export default function PetHotelsPage() {
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">სერვისები</h1>
          <p className="text-stone-500 text-sm">იპოვეთ საუკეთესო სერვისები თქვენი შინაური ცხოველისთვის</p>
        </div>
        <Suspense fallback={null}>
          <ServicesTabs active="pet-hotels" />
          <MarketplaceSearch />
        </Suspense>
        <div className="space-y-4">
          {PET_HOTELS.map((biz) => (
            <RealBusinessCard key={biz._id} business={biz} />
          ))}
        </div>
      </div>
    </div>
  );
}
