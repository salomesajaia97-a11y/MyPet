import { Star } from "lucide-react";
import type { VipTier } from "@/lib/marketplace/vipPackages";

const STYLES: Record<VipTier, string> = {
  standard: "bg-amber-100 text-amber-700 border-amber-200",
  super: "bg-orange-100 text-orange-700 border-orange-300",
  ultra: "bg-gradient-to-r from-amber-400 to-orange-500 text-white border-orange-400",
};

/**
 * Tier-aware promotion badge. Higher tiers read louder on purpose.
 *
 * `label` is passed in rather than looked up through the `useT()` hook so this
 * renders in both Server Components (the four browse pages, which receive a
 * dictionary as a prop) and Client Components (the homepage card).
 */
export function VipBadge({ tier, label }: { tier: VipTier; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${STYLES[tier]}`}
    >
      <Star className="h-3 w-3" />
      {label}
    </span>
  );
}
