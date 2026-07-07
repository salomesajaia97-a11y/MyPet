import { ServicesTabs } from "@/components/services/ServicesTabs";
import { ServicesSearch } from "@/components/services/ServicesSearch";
import { ServicesFab } from "@/components/services/ServicesFab";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";

export const dynamic = "force-dynamic";

export default async function PetHotelsPage() {
  const businesses = await fetchDBBusinesses("pet-hotels");

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">ცხოველთა სასტუმროები</h1>
          <p className="text-stone-500 text-sm">სასტუმროები და მინდობით მოვლა თქვენი შინაური ცხოველისთვის</p>
        </div>
        <ServicesTabs active="pet-hotels" />
        <ServicesSearch businesses={businesses} category="pet-hotels" />
      </div>
      <ServicesFab />
    </div>
  );
}
