import { Suspense } from "react";
import { ListingGrid } from "@/components/marketplace/ListingGrid";
import { ListingFilters } from "@/components/marketplace/ListingFilters";
import type { BuySellListing } from "@/types/marketplace";

const MOCK: BuySellListing[] = [
  {
    _id: "1",
    type: "buy-sell",
    species: "dog",
    breed: "Labrador Retriever",
    age: 6,
    images: [],
    description: "Healthy male puppy, all vaccinations done.",
    location: "Tbilisi",
    contactName: "Giorgi",
    contactPhone: "+995 555 000 000",
    createdAt: new Date().toISOString(),
    userId: "u1",
    price: 800,
    currency: "GEL",
    vaccinated: true,
    hasPassport: true,
    pedigree: "FCI",
  },
];

interface Props {
  searchParams: Promise<Record<string, string>>;
}

export default async function BuySellPage({ searchParams }: Props) {
  const _ = await searchParams;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Buy &amp; Sell</h1>
        <p className="text-muted-foreground text-sm mt-1">ყიდვა / გაყიდვა</p>
      </div>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0 hidden md:block">
          <Suspense fallback={null}>
            <ListingFilters type="buy-sell" />
          </Suspense>
        </aside>
        <div className="flex-1 min-w-0">
          <ListingGrid listings={MOCK} type="buy-sell" />
        </div>
      </div>
    </div>
  );
}
