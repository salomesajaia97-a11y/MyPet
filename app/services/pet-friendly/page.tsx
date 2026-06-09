import { Suspense } from "react";
import Link from "next/link";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { RealBusinessCard } from "@/components/services/RealBusinessCard";
import { PET_FRIENDLY } from "@/lib/data/businesses";

export default function PetFriendlyPage() {
  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">სერვისები</h1>
          <p className="text-stone-500 text-sm">იპოვეთ საუკეთესო სერვისები თქვენი შინაური ცხოველისთვის</p>
        </div>
        <Suspense fallback={null}>
          <ServicesTabs active="pet-friendly" />
          <MarketplaceSearch />
        </Suspense>

        {/* Indoor badge legend */}
        <div className="flex items-center gap-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Indoor Allowed — შიგნით შემოყვანა შეიძლება
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            Outdoor Only — მხოლოდ გარე სივრცე
          </span>
        </div>

        <div className="space-y-4">
          {PET_FRIENDLY.map((place) => (
            <RealBusinessCard key={place._id} business={place} />
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
