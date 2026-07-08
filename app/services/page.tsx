import { ServicesTabs } from "@/components/services/ServicesTabs";
import { ServicesSearch } from "@/components/services/ServicesSearch";
import { ServicesFab } from "@/components/services/ServicesFab";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const CATEGORIES = ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"];

export default async function ServicesPage() {
  const { t } = await getServerDictionary();
  // Live businesses across every category — the index is a combined feed;
  // each card links to its own category's detail page via ServicesSearch.
  const lists = await Promise.all(CATEGORIES.map((c) => fetchDBBusinesses(c)));
  const businesses = lists.flat();

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">{t.services.index.title}</h1>
          <p className="text-stone-500 text-sm">{t.services.index.subtitle}</p>
        </div>

        <ServicesTabs active="" />
        <ServicesSearch businesses={businesses} />
      </div>
      <ServicesFab />
    </div>
  );
}
