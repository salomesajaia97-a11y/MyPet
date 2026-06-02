import Image from "next/image";
import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Business } from "@/types/services";

interface Props {
  business: Business;
  href: string;
}

export function BusinessCard({ business, href }: Props) {
  return (
    <Link href={href} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="aspect-video relative bg-muted overflow-hidden">
          {business.images[0] ? (
            <Image src={business.images[0]} alt={business.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">🏥</div>
          )}
          {business.is24h && (
            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              24/7
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold leading-tight">{business.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{business.aggregateRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">
                  ({business.googleRatingCount + business.nativeRatingCount})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {business.neighborhood}, {business.city}
          </div>

          {business.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {business.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {business.pricePerNight !== undefined && (
            <p className="text-sm font-semibold text-primary">from {business.pricePerNight} ₾/night</p>
          )}
        </div>
      </div>
    </Link>
  );
}
