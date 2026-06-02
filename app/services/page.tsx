import { Suspense } from "react";
import { ServicesTabs } from "@/components/services/ServicesTabs";
import { MarketplaceSearch } from "@/components/marketplace/MarketplaceSearch";
import { Star, MapPin, Phone } from "lucide-react";

const MOCK_BUSINESSES = [
  {
    _id: "1", name: "ვეტერინარული კლინიკა 'პროვეტი'", category: "ვეტკლინიკები",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop",
    rating: 4.8, reviewCount: 142, is24h: true,
    tags: ["24/7", "ოპერაცია", "ლაბორატორია", "რენტგენი"],
    address: "ჭავჭავაძის 33ა, თბილისი, ვაკე", phone: "+995 32 2 99 99 99",
  },
  {
    _id: "2", name: "ვეტერინარული ცენტრი 'ანიმალი'", category: "ვეტკლინიკები",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&auto=format&fit=crop",
    rating: 4.6, reviewCount: 98, is24h: false,
    tags: ["დიაგნოსტიკა", "ვაქცინაცია", "პროფილაქტიკა"],
    address: "ვაზა-ფშაველას 71, თბილისი, საბურთალო", phone: "+995 32 2 88 88 88",
  },
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-[#1C1917] mb-1">სერვისები</h1>
          <p className="text-stone-500 text-sm">იპოვეთ საუკეთესო სერვისები თქვენი შინაური ცხოველისთვის</p>
        </div>

        <Suspense fallback={null}>
          <ServicesTabs active="vet-clinics" />
          <MarketplaceSearch />
        </Suspense>

        <div className="space-y-4">
          {MOCK_BUSINESSES.map((biz) => (
            <FigmaBusinessCard key={biz._id} business={biz} />
          ))}
        </div>
      </div>
      <FigmaFAB />
    </div>
  );
}

function FigmaBusinessCard({ business }: { business: typeof MOCK_BUSINESSES[0] }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={business.image} alt={business.name} className="w-full h-full object-cover" />
          {business.is24h && (
            <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              ⏰ 24/7
            </div>
          )}
        </div>
        <div className="p-4 flex-1 space-y-2 min-w-0">
          <p className="font-bold text-[#1C1917] text-base leading-tight">{business.name}</p>
          <p className="text-stone-500 text-sm">{business.category}</p>
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{business.rating}</span>
            <span className="text-stone-400">({business.reviewCount} შეფასება)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {business.tags.map((tag) => (
              <span key={tag} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
          <p className="text-xs text-stone-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" /> {business.address}
          </p>
          <p className="text-xs text-stone-500 flex items-center gap-1">
            <Phone className="w-3 h-3 shrink-0" /> {business.phone}
          </p>
        </div>
      </div>
    </div>
  );
}

function FigmaFAB() {
  return (
    <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#6B5240] text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-[#5a4435] transition-colors z-50">
      +
    </button>
  );
}
