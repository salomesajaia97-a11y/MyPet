import { ServicesTabs } from "@/components/services/ServicesTabs";
import { ServicesSearch } from "@/components/services/ServicesSearch";
import { ServicesFab } from "@/components/services/ServicesFab";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function VetClinicsPage() {
  const { t } = await getServerDictionary();
  const businesses = await fetchDBBusinesses("vet-clinics");

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">{t.services.categories.vetClinics.title}</h1>
          <p className="text-stone-500 text-sm">{t.services.categories.vetClinics.subtitle}</p>
        </div>
        <ServicesTabs active="vet-clinics" />
        <ServicesSearch businesses={businesses} category="vet-clinics" />
      </div>
      <ServicesFab />
    </div>
  );
}
