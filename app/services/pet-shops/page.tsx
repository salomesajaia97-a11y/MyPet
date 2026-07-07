import { ServicesTabs } from "@/components/services/ServicesTabs";
import { ServicesSearch } from "@/components/services/ServicesSearch";
import { ServicesFab } from "@/components/services/ServicesFab";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";

export const dynamic = "force-dynamic";

export default async function PetShopsPage() {
  const businesses = await fetchDBBusinesses("pet-shops");

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">პეტ მაღაზიები</h1>
          <p className="text-stone-500 text-sm">საკვები, აქსესუარები და ყველაფერი თქვენი შინაური ცხოველისთვის</p>
        </div>
        <ServicesTabs active="pet-shops" />
        <ServicesSearch businesses={businesses} category="pet-shops" />
      </div>
      <ServicesFab />
    </div>
  );
}
