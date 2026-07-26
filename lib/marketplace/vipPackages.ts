/**
 * The three paid promotion packages. Single source of truth for price,
 * duration and ranking — the checkout route derives the amount from here so a
 * client can never dictate what it pays.
 *
 * `amount` is in tetri (GEL minor units) because that is what Flitt expects:
 * 300 = 3.00 GEL. `rank` drives placement, higher wins.
 */
export type VipTier = "standard" | "super" | "ultra";

export interface VipPackage {
  tier: VipTier;
  days: number;
  amount: number; // tetri
  rank: 1 | 2 | 3;
}

/** Display order, cheapest first. */
export const VIP_TIERS = ["standard", "super", "ultra"] as const satisfies readonly VipTier[];

export const VIP_PACKAGES: Record<VipTier, VipPackage> = {
  standard: { tier: "standard", days: 3, amount: 300, rank: 1 },
  super: { tier: "super", days: 7, amount: 700, rank: 2 },
  ultra: { tier: "ultra", days: 14, amount: 1200, rank: 3 },
};

export function isVipTier(value: unknown): value is VipTier {
  return typeof value === "string" && value in VIP_PACKAGES;
}

/** Tetri → display string: 1200 → "12", 350 → "3.50". */
export function formatGel(amountTetri: number): string {
  return (amountTetri / 100).toFixed(2).replace(/\.00$/, "");
}
