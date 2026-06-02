import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, AlertTriangle } from "lucide-react";
import type { LostFoundListing } from "@/types/marketplace";

interface Props {
  listing: LostFoundListing;
  href: string;
}

export function LostFoundCard({ listing, href }: Props) {
  return (
    <Link href={href} className="group block">
      <div
        className={`rounded-xl overflow-hidden border-2 transition-all duration-200 hover:shadow-md ${
          listing.status === "lost"
            ? "border-red-200 bg-red-50/50"
            : "border-emerald-200 bg-emerald-50/50"
        }`}
      >
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {listing.images[0] ? (
            <Image
              src={listing.images[0]}
              alt={listing.breed}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">
              🐾
            </div>
          )}
          <div
            className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
              listing.status === "lost"
                ? "bg-red-500 text-white"
                : "bg-emerald-500 text-white"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            {listing.status === "lost" ? "LOST" : "FOUND"}
          </div>
          {listing.isResolved && (
            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
              <span className="text-foreground font-bold text-lg">
                RESOLVED ✓
              </span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <p className="font-semibold">{listing.breed}</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            {listing.neighborhood}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last seen:{" "}
            {new Date(listing.lastSeenDate).toLocaleDateString("ka-GE")}
          </div>
          {listing.reward !== null && (
            <p className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-md inline-block">
              Reward: {listing.reward} ₾
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
