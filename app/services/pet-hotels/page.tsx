import { Suspense } from "react";
import Link from "next/link";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { RealBusinessCard } from "@/components/services/RealBusinessCard";
import { PET_HOTELS } from "@/lib/data/businesses";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";

export const dynamic = "force-dynamic";

export default async function PetHotelsPage() {
  const dbBusinesses = await fetchDBBusinesses("pet-hotels");
  const businesses = [...dbBusinesses, ...PET_HOTELS];

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
          {businesses.map((biz) => (
            <RealBusinessCard key={biz._id} business={biz} />
          ))}
        </div>
      </div>
      <Link
        href="/services/new"
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#0E4A5C] text-white rounded-full shadow-lg px-5 py-3 text-sm font-semibold hover:bg-[#0B3D4E] transition-colors z-50"
      >
        + ბიზნესის დამატება
      </Link>
    </div>
  );
}
