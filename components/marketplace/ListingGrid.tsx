import { ListingCard } from "./ListingCard";
import { LostFoundCard } from "./LostFoundCard";
import type { Listing, LostFoundListing, MarketplaceType } from "@/types/marketplace";

interface Props {
  listings: Listing[];
  type: MarketplaceType;
}

export function ListingGrid({ listings, type }: Props) {
  if (listings.length === 0) {
    return (
      <div className="col-span-full py-20 text-center text-muted-foreground">
        <div className="text-5xl mb-4">🐾</div>
        <p className="text-lg font-medium">No listings found</p>
        <p className="text-sm mt-1">Be the first to post in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {listings.map((listing) => {
        const href = `/${type}/${listing._id}`;
        if (listing.type === "lost-found") {
          return (
            <LostFoundCard
              key={listing._id}
              listing={listing as LostFoundListing}
              href={href}
            />
          );
        }
        return <ListingCard key={listing._id} listing={listing} href={href} />;
      })}
    </div>
  );
}
