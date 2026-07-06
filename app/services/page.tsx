import Link from "next/link";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { ServicesSearch } from "@/components/services/ServicesSearch";
import { fetchDBBusinesses } from "@/lib/fetchBusinesses";

export const dynamic = "force-dynamic";

const CATEGORIES = ["vet-clinics", "pet-hotels", "pet-shops", "pet-friendly"];

export default async function ServicesPage() {
  // Live businesses across every category — the index is a combined feed;
  // each card links to its own category's detail page via ServicesSearch.
  const lists = await Promise.all(CATEGORIES.map((c) => fetchDBBusinesses(c)));
  const businesses = lists.flat();

  return (
    <div className="min-h-screen bg-[#EBF6FA]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#0F2830] mb-1">სერვისები</h1>
          <p className="text-stone-500 text-sm">იპოვეთ საუკეთესო სერვისები თქვენი შინაური ცხოველისთვის</p>
        </div>

        <ServicesTabs active="" />
        <ServicesSearch businesses={businesses} />
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
