import { Suspense } from "react";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { RealBusinessCard } from "@/components/services/RealBusinessCard";
import { VET_CLINICS } from "@/lib/data/businesses";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">სერვისები</h1>
          <p className="text-stone-500 text-sm">იპოვეთ საუკეთესო სერვისები თქვენი შინაური ცხოველისთვის</p>
        </div>

        <Suspense fallback={null}>
          <ServicesTabs active="vet-clinics" />
          <MarketplaceSearch />
        </Suspense>

        <div className="space-y-4">
          {VET_CLINICS.map((biz) => (
            <RealBusinessCard key={biz._id} business={biz} />
          ))}
        </div>
      </div>
      <FigmaFAB />
    </div>
  );
}

function FigmaFAB() {
  return (
    <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#0E4A5C] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#0B3D4E] transition-colors z-50">
      +
    </button>
  );
}
