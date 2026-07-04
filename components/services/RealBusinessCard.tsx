// components/services/RealBusinessCard.tsx
import { Star, MapPin, Phone, Globe, Clock } from "lucide-react";
import type { BusinessData } from "@/lib/data/businesses";

interface Props {
  business: BusinessData;
}

export function RealBusinessCard({ business }: Props) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex">
        {/* Image */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 bg-[#EBF6FA]">
          {business.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={business.image}
              alt={business.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              🐾
            </div>
          )}
          {business.is24h && (
            <div className="absolute top-2 left-2 bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" /> 24/7
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 flex-1 space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-[#0F2830] text-base leading-tight">{business.name}</p>
              <p className="text-stone-400 text-xs mt-0.5">{business.nameKa}</p>
            </div>
            {business.pricePerNight && (
              <span className="shrink-0 text-sm font-bold text-[#0E4A5C] bg-[#0E4A5C]/10 px-2.5 py-1 rounded-full">
                {business.pricePerNight}₾/ღამე
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{business.rating}</span>
            <span className="text-stone-400 text-xs">({business.reviewCount} შეფასება)</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {business.tags.map((tag) => (
              <span key={tag} className="text-xs bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Address */}
          <p className="text-xs text-stone-500 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
            {business.address}, {business.neighborhood}, {business.city}
          </p>

          {/* Phone & Website */}
          <div className="flex items-center gap-4">
            <a href={`tel:${business.phone}`} className="text-xs text-[#0E4A5C] flex items-center gap-1.5 hover:underline">
              <Phone className="w-3 h-3 shrink-0" />
              {business.phone}
            </a>
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-400 flex items-center gap-1 hover:text-[#0E4A5C]">
                <Globe className="w-3 h-3" />
                ვებ-გვერდი
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
