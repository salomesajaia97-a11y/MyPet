import { connectDB } from "@/lib/db";
import SiteSettingModel from "@/lib/models/SiteSetting";
import { VIP_PACKAGES, VIP_TIERS, type VipPackage, type VipTier } from "@/lib/marketplace/vipPackages";

export interface SiteFlags {
  aiSearch: boolean;
  payments: boolean;
  registration: boolean;
}

export interface SiteSettings {
  vip: Record<VipTier, VipPackage>;
  flags: SiteFlags;
}

type StoredVip = Partial<Record<VipTier, { amount?: number; days?: number } | undefined>>;

const DEFAULT_FLAGS: SiteFlags = { aiSearch: true, payments: true, registration: true };

/**
 * Merge stored overrides over the code defaults.
 *
 * Pure and exported so the merge itself is testable: this is the function that
 * decides what a customer is charged, and "the DB said nothing about ultra"
 * must mean "charge the default", never "charge zero".
 */
export function mergeVip(stored: StoredVip | null | undefined): Record<VipTier, VipPackage> {
  const merged = {} as Record<VipTier, VipPackage>;
  for (const tier of VIP_TIERS) {
    const base = VIP_PACKAGES[tier];
    const override = stored?.[tier];
    const amount = Number(override?.amount);
    const days = Number(override?.days);
    merged[tier] = {
      ...base,
      // A stored 0 is refused rather than honoured: free VIP is a mistake, and
      // Flitt would reject a zero-amount order anyway.
      amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : base.amount,
      days: Number.isFinite(days) && days > 0 ? Math.round(days) : base.days,
    };
  }
  return merged;
}

export function mergeFlags(stored: Partial<SiteFlags> | null | undefined): SiteFlags {
  return {
    aiSearch: stored?.aiSearch !== false,
    payments: stored?.payments !== false,
    registration: stored?.registration !== false,
  };
}

/**
 * Cached for a short window because this is read on the checkout path and on
 * every page that prices a package. The window is deliberately small and the
 * cache is cleared on save, so a price change is immediate in the instance that
 * made it and at most `TTL_MS` stale anywhere else. Nothing here is worth a
 * cross-instance invalidation mechanism.
 */
const TTL_MS = 30_000;
let cache: { at: number; value: SiteSettings } | null = null;

export function clearSettingsCache(): void {
  cache = null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  try {
    await connectDB();
    const doc = await SiteSettingModel.findOne({ key: "site" }).lean<{
      vip?: StoredVip;
      flags?: Partial<SiteFlags>;
    } | null>();
    const value: SiteSettings = { vip: mergeVip(doc?.vip), flags: mergeFlags(doc?.flags) };
    cache = { at: Date.now(), value };
    return value;
  } catch (err) {
    // A settings read must never take the site down: fall back to the code
    // defaults, which are what the site ran on before this existed.
    console.error("[settings] read failed", err instanceof Error ? err.message : err);
    return { vip: mergeVip(null), flags: DEFAULT_FLAGS };
  }
}

/** Live package table — prices and durations as the panel currently has them. */
export async function getVipPackages(): Promise<Record<VipTier, VipPackage>> {
  return (await getSiteSettings()).vip;
}

export async function getFlags(): Promise<SiteFlags> {
  return (await getSiteSettings()).flags;
}
