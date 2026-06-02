import { Suspense } from "react";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { RealBusinessCard } from "@/components/services/RealBusinessCard";
import { PET_SHOPS } from "@/lib/data/businesses";

export default function PetShopsPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#1C1917] mb-1">სერვისები</h1>
          <p className="text-stone-500 text-sm">იპოვეთ საუკეთესო სერვისები თქვენი შინაური ცხოველისთვის</p>
        </div>
        <Suspense fallback={null}>
          <ServicesTabs active="pet-shops" />
          <MarketplaceSearch />
        </Suspense>
        <div className="space-y-4">
          {PET_SHOPS.map((biz) => (
            <RealBusinessCard key={biz._id} business={biz} />
          ))}
        </div>
      </div>
    </div>
  );
}
