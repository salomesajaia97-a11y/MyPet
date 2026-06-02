import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Listing } from "@/types/marketplace";

const typeLabels: Record<string, string> = {
  "buy-sell": "გაყიდვა",
  adoption: "გაჩუქება",
  mating: "შეჯვარება",
  "lost-found": "დაკარგული",
};

const typeBadgeColors: Record<string, string> = {
  "buy-sell": "bg-cream-200 text-cream-800",
  adoption: "bg-emerald-100 text-emerald-800",
  mating: "bg-violet-100 text-violet-800",
  "lost-found": "bg-red-100 text-red-800",
};

interface Props {
  listing: Listing;
  href: string;
}

function resolvePrice(listing: Listing): string | null {
  if (listing.type === "buy-sell") {
    // narrowed to BuySellListing — price is number
    return `${listing.price} ₾`;
  }
  if (listing.type === "mating") {
    // narrowed to MatingListing — price is number | null
    return listing.price !== null ? `${listing.price} ₾` : null;
  }
  return null;
}

export function ListingCard({ listing, href }: Props) {
  const price = resolvePrice(listing);

  return (
    <Link href={href} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {listing.images[0] ? (
            <Image
              src={listing.images[0]}
              alt={`${listing.breed} — ${listing.location}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
              🐾
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                typeBadgeColors[listing.type]
              )}
            >
              {typeLabels[listing.type]}
            </span>
          </div>
          {price && (
            <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg text-sm font-semibold">
              {price}
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-foreground leading-tight">
                {listing.breed}
              </p>
              <p className="text-sm text-muted-foreground capitalize">
                {listing.species}
              </p>
            </div>
            {listing.type === "buy-sell" && (() => {
              // capture narrowed listing in a closure so JSX can access it
              const buySell = listing;
              return (
                <div className="flex flex-wrap gap-1 justify-end">
                  {buySell.vaccinated && (
                    <Badge variant="secondary" className="text-xs">
                      Vaccinated
                    </Badge>
                  )}
                  {buySell.pedigree !== "none" && (
                    <Badge variant="secondary" className="text-xs">
                      {buySell.pedigree}
                    </Badge>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {listing.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {listing.age < 12
                ? `${listing.age}mo`
                : `${Math.floor(listing.age / 12)}yr`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
