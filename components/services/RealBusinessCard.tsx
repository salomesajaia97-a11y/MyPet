// components/services/RealBusinessCard.tsx
"use client";
import Link from "next/link";
import { Star, MapPin, Phone, Globe, Clock } from "lucide-react";
import type { BusinessData } from "@/lib/data/businesses";
import PhoneLink from "@/components/ui/PhoneLink";
import { useT } from "@/components/i18n/LanguageProvider";

interface Props {
  business: BusinessData;
  // When provided, the whole card links here via a stretched overlay. Phone /
  // website stay independently clickable (they sit above the overlay) — this
  // avoids nesting <a> inside <a>, which is invalid HTML and breaks hydration.
  href?: string;
}

export function RealBusinessCard({ business, href }: Props) {
  const { t } = useT();
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
      {href && (
        <Link
          href={href}
          aria-label={business.name}
          className="absolute inset-0 z-[1]"
        />
      )}
      <div className="flex">
        {/* Image */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 shrink-0 bg-[#EBF6FA]">
          {business.image ? (
            // Raw <img>: directory businesses carry scraped image URLs from
            // arbitrary external hosts, which next/image would reject (host not
            // in remotePatterns). Keep unoptimized until images are self-hosted.
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
              {business.nameKa && business.nameKa !== business.name && (
                <p className="text-stone-400 text-xs mt-0.5">{business.nameKa}</p>
              )}
            </div>
            {business.pricePerNight && (
              <span className="shrink-0 text-sm font-bold text-[#0E4A5C] bg-[#0E4A5C]/10 px-2.5 py-1 rounded-full">
                {business.pricePerNight}{t.services.perNight}
              </span>
            )}
          </div>

          {/* Rating — hidden when there's no score yet (OSM rows), so cards
              never show a misleading "0 (0 reviews)". */}
          {business.rating > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{business.rating}</span>
              {business.reviewCount > 0 && (
                <span className="text-stone-400 text-xs">({business.reviewCount} {t.services.reviewWord})</span>
              )}
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {business.tags.map((tag) => (
              <span key={tag} className="text-xs bg-stone-100 text-stone-600 px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* Address */}
          {(() => {
            const loc = [business.address, business.neighborhood, business.city]
              .filter(Boolean)
              .join(", ");
            return loc ? (
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 shrink-0 text-stone-400" />
                {loc}
              </p>
            ) : null;
          })()}

          {/* Phone & Website — sit above the stretched link overlay so they
              stay clickable; stop propagation so they don't trigger card nav. */}
          <div className="relative z-[2] flex items-center gap-4 w-fit">
            {business.phone && (
              <PhoneLink phone={business.phone} className="text-xs text-[#0E4A5C] flex items-center gap-1.5 hover:underline">
                <Phone className="w-3 h-3 shrink-0" />
                {business.phone}
              </PhoneLink>
            )}
            {business.website && (
              <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-400 flex items-center gap-1 hover:text-[#0E4A5C]">
                <Globe className="w-3 h-3" />
                {t.services.website}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
