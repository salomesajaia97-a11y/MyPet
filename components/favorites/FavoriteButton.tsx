"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";
import { useFavorites } from "./FavoritesProvider";

/**
 * Heart toggle for a listing. Renders the same regardless of auth; clicking
 * while logged out sends the user to /login. Placed on cards inside a Link, so
 * it stops event propagation and prevents the card navigation.
 */
export function FavoriteButton({
  listingId,
  className = "",
}: {
  listingId: string;
  className?: string;
}) {
  const favorites = useFavorites();
  const { status } = useSession();
  const router = useRouter();

  const active = favorites?.isFavorite(listingId) ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (status !== "authenticated") {
      router.push("/login");
      return;
    }
    favorites?.toggle(listingId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "ფავორიტებიდან ამოღება" : "ფავორიტებში დამატება"}
      aria-pressed={active}
      className={className}
    >
      <Heart
        className={`w-3.5 h-3.5 transition-colors ${
          active ? "fill-rose-500 text-rose-500" : "text-stone-400 hover:text-rose-500"
        }`}
      />
    </button>
  );
}
